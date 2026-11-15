import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { toDataURL } from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, DisableMfaDto, LoginDto, MfaCodeDto, MfaDto, PasswordDto, UpdateUserDto } from './dto';
import { generateSecret, hashRecovery, matchRecovery, recoveryCodes, verifyTotp } from './totp';

const publicUser = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  passwordLogin: true,
  mfaEnabled: true,
  createdAt: true,
} as const;

function withName<T extends { firstName: string; lastName: string }>(user: T) {
  return { ...user, name: `${user.firstName} ${user.lastName}`.trim() };
}

function recoveryHashes(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    const valid = user ? await bcrypt.compare(dto.password, user.passwordHash) : false;
    if (!user || !valid) {
      throw new UnauthorizedException('Identifiants incorrects.');
    }
    if (!user.passwordLogin) {
      throw new UnauthorizedException('Ce compte se connecte uniquement avec une clé d’accès.');
    }
    if (user.mfaEnabled) {
      if (!user.mfaSecret) throw new UnauthorizedException('La double authentification n’est pas disponible.');
      const ticket = await this.jwt.signAsync(
        { sub: user.id, email: user.email, purpose: 'mfa' },
        { expiresIn: '5m' },
      );
      return { mfaRequired: true as const, ticket };
    }
    return this.session(user);
  }

  async verifyMfa(dto: MfaDto) {
    let payload: { sub?: string; email?: string; purpose?: string };
    try {
      payload = await this.jwt.verifyAsync(dto.ticket);
    } catch {
      throw new UnauthorizedException('La vérification a expiré. Recommencez la connexion.');
    }
    if (payload.purpose !== 'mfa' || !payload.sub) {
      throw new UnauthorizedException('La vérification a expiré. Recommencez la connexion.');
    }
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user?.mfaEnabled || !user.mfaSecret) {
      throw new UnauthorizedException('La double authentification n’est pas active.');
    }
    const code = dto.code.trim();
    if (verifyTotp(user.mfaSecret, code)) return this.session(user);
    const hashes = recoveryHashes(user.mfaRecovery);
    if (!matchRecovery(code, hashes)) {
      throw new UnauthorizedException('Code incorrect.');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { mfaRecovery: hashes.filter((hash) => !matchRecovery(code, [hash])) },
    });
    return this.session(user);
  }

  async prepareMfa(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Session expirée.');
    if (!user.passwordLogin) {
      throw new BadRequestException('Réactivez d’abord la connexion par mot de passe.');
    }
    if (user.mfaEnabled) throw new BadRequestException('La double authentification est déjà active.');
    const secret = generateSecret();
    await this.prisma.user.update({ where: { id: userId }, data: { mfaSecret: secret, mfaRecovery: [] } });
    const label = encodeURIComponent(user.email);
    const issuer = encodeURIComponent('Saint-Nicolas du Rhône');
    const otpauthUrl = `otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
    const qr = await toDataURL(otpauthUrl, { margin: 1, width: 220 });
    return { secret, qr };
  }

  async enableMfa(userId: string, dto: MfaCodeDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.mfaSecret) throw new BadRequestException('Préparez d’abord la double authentification.');
    if (user.mfaEnabled) throw new BadRequestException('La double authentification est déjà active.');
    if (!verifyTotp(user.mfaSecret, dto.code.trim())) {
      throw new UnauthorizedException('Code incorrect.');
    }
    const codes = recoveryCodes();
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true, mfaRecovery: codes.map(hashRecovery) },
    });
    return { enabled: true, recoveryCodes: codes };
  }

  async disableMfa(userId: string, dto: DisableMfaDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const passwordOk = user ? await bcrypt.compare(dto.password, user.passwordHash) : false;
    if (!user || !passwordOk) throw new UnauthorizedException('Mot de passe incorrect.');
    if (!user.mfaEnabled || !user.mfaSecret) {
      throw new BadRequestException('La double authentification n’est pas active.');
    }
    const code = dto.code.trim();
    const hashes = recoveryHashes(user.mfaRecovery);
    const codeOk = verifyTotp(user.mfaSecret, code) || matchRecovery(code, hashes);
    if (!codeOk) throw new UnauthorizedException('Code incorrect.');
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null, mfaRecovery: [] },
    });
    return { enabled: false };
  }

  async issueSession(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Session expirée.');
    return this.session(user);
  }

  private async session(user: { id: string; email: string; firstName: string; lastName: string }) {
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email });
    return { accessToken, id: user.id, name: withName(user).name, email: user.email };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { ...publicUser, _count: { select: { passkeys: true } } },
    });
    if (!user) throw new UnauthorizedException('Session expirée.');
    const { _count, ...rest } = user;
    return { ...withName(rest), passkeyCount: _count.passkeys };
  }

  async preferPasskeyOnly(userId: string) {
    const count = await this.prisma.passkey.count({ where: { userId } });
    if (count < 1) {
      throw new BadRequestException('Ajoutez d’abord une clé d’accès.');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordLogin: false,
        mfaEnabled: false,
        mfaSecret: null,
        mfaRecovery: [],
      },
    });
    return this.me(userId);
  }

  async allowPasswordLogin(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordLogin: true },
    });
    return this.me(userId);
  }

  async ensurePasswordLoginIfNoPasskey(userId: string) {
    const count = await this.prisma.passkey.count({ where: { userId } });
    if (count > 0) return;
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordLogin: true },
    });
  }

  async listUsers() {
    const users = await this.prisma.user.findMany({
      select: publicUser,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
    return users.map(withName);
  }

  async createUser(dto: CreateUserDto) {
    try {
      return withName(
        await this.prisma.user.create({
          data: {
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            email: dto.email.trim().toLowerCase(),
            passwordHash: await bcrypt.hash(dto.password, 10),
          },
          select: publicUser,
        }),
      );
    } catch (error) {
      this.rethrowKnown(error);
    }
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const password = dto.password?.trim();
    try {
      return withName(
        await this.prisma.user.update({
          where: { id },
          data: {
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            email: dto.email.trim().toLowerCase(),
            ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
          },
          select: publicUser,
        }),
      );
    } catch (error) {
      this.rethrowKnown(error);
    }
  }

  async removeUser(id: string, actorId: string) {
    if (id === actorId) {
      throw new BadRequestException('Vous ne pouvez pas supprimer votre propre compte.');
    }
    const count = await this.prisma.user.count();
    if (count <= 1) {
      throw new BadRequestException('Le dernier compte ne peut pas être supprimé.');
    }
    try {
      await this.prisma.user.delete({ where: { id } });
    } catch (error) {
      this.rethrowKnown(error);
    }
    return { ok: true };
  }

  private rethrowKnown(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Cette adresse est déjà utilisée.');
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new NotFoundException('Ce compte est introuvable.');
    }
    throw error;
  }

  async changePassword(userId: string, dto: PasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const valid = user ? await bcrypt.compare(dto.currentPassword, user.passwordHash) : false;
    if (!user || !valid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect.');
    }
    if (!user.passwordLogin) {
      throw new BadRequestException('Réactivez d’abord la connexion par mot de passe.');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(dto.nextPassword, 10) },
    });
    return { ok: true };
  }
}
