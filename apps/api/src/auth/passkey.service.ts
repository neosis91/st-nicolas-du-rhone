import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

const transports = ['ble', 'cable', 'hybrid', 'internal', 'nfc', 'smart-card', 'usb'] as const;

type Ceremony = { kind: 'reg' | 'auth'; userId: string | null; expires: number };

@Injectable()
export class PasskeyService {
  private readonly challenges = new Map<string, Ceremony>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly auth: AuthService,
  ) {}

  async list(userId: string) {
    const rows = await this.prisma.passkey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, backedUp: true, createdAt: true },
    });
    return rows;
  }

  async prepareRegistration(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { passkeys: true } });
    if (!user) throw new UnauthorizedException('Session expirée.');
    const options = await generateRegistrationOptions({
      rpName: this.rpName(),
      rpID: this.rpId(),
      userName: user.email,
      userDisplayName: `${user.firstName} ${user.lastName}`.trim(),
      userID: new TextEncoder().encode(user.id),
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      excludeCredentials: user.passkeys.map((passkey) => ({
        id: passkey.credentialId,
        transports: this.transportsOf(passkey.transports),
      })),
    });
    this.remember(options.challenge, 'reg', user.id);
    return options;
  }

  async register(userId: string, body: unknown) {
    const { response, name } = this.registrationBody(body);
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: (challenge) => this.consume(challenge, 'reg', userId),
        expectedOrigin: this.origins(),
        expectedRPID: this.rpId(),
        requireUserVerification: false,
      });
    } catch {
      throw new UnauthorizedException('La clé d’accès n’a pas pu être enregistrée.');
    }
    if (!verification.verified) throw new UnauthorizedException('La clé d’accès n’a pas pu être enregistrée.');
    const { credential, credentialBackedUp } = verification.registrationInfo;
    const label = name || 'Clé d’accès';
    const saved = await this.prisma.passkey.create({
      data: {
        userId,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: credential.counter,
        transports: (response.response.transports ?? credential.transports ?? []).join(','),
        name: label,
        backedUp: credentialBackedUp,
      },
      select: { id: true, name: true, backedUp: true, createdAt: true },
    });
    const account = await this.auth.me(userId);
    return { ...saved, offerPasskeyOnly: account.passwordLogin };
  }

  async remove(userId: string, id: string) {
    const passkey = await this.prisma.passkey.findFirst({ where: { id, userId } });
    if (!passkey) throw new BadRequestException('Cette clé d’accès est introuvable.');
    await this.prisma.passkey.delete({ where: { id } });
    await this.auth.ensurePasswordLoginIfNoPasskey(userId);
    return { ok: true };
  }

  async prepareLogin() {
    const options = await generateAuthenticationOptions({
      rpID: this.rpId(),
      userVerification: 'preferred',
    });
    this.remember(options.challenge, 'auth', null);
    return options;
  }

  async login(body: unknown) {
    const response = this.authenticationBody(body);
    const passkey = await this.prisma.passkey.findUnique({ where: { credentialId: response.id } });
    if (!passkey) {
      throw new UnauthorizedException(
        'Cette clé n’est pas enregistrée sur le site. Connectez-vous avec le mot de passe, puis ajoutez-la de nouveau dans Mon profil.',
      );
    }
    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: (challenge) => this.consume(challenge, 'auth'),
        expectedOrigin: this.origins(),
        expectedRPID: this.rpId(),
        requireUserVerification: false,
        credential: {
          id: passkey.credentialId,
          publicKey: new Uint8Array(passkey.publicKey),
          counter: passkey.counter,
          transports: this.transportsOf(passkey.transports),
        },
      });
    } catch {
      throw new UnauthorizedException(
        'La clé d’accès n’a pas pu être confirmée. Ouvrez le site sur http://localhost:4200 en local.',
      );
    }
    if (!verification.verified) {
      throw new UnauthorizedException('La clé d’accès n’a pas pu être confirmée.');
    }
    await this.prisma.passkey.update({
      where: { id: passkey.id },
      data: {
        counter: verification.authenticationInfo.newCounter,
        backedUp: verification.authenticationInfo.credentialBackedUp,
      },
    });
    return this.auth.issueSession(passkey.userId);
  }

  private registrationBody(body: unknown) {
    if (!this.isRecord(body) || !this.isRecord(body.response)) {
      throw new BadRequestException('Réponse de clé d’accès incomplète.');
    }
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';
    return { response: body.response as unknown as RegistrationResponseJSON, name };
  }

  private authenticationBody(body: unknown) {
    if (!this.isRecord(body) || !this.isRecord(body.response)) {
      throw new BadRequestException('Réponse de clé d’accès incomplète.');
    }
    return body.response as unknown as AuthenticationResponseJSON;
  }

  private remember(challenge: string, kind: Ceremony['kind'], userId: string | null) {
    this.prune();
    this.challenges.set(challenge, { kind, userId, expires: Date.now() + 5 * 60 * 1000 });
  }

  private consume(challenge: string, kind: Ceremony['kind'], userId?: string) {
    this.prune();
    const found = this.challenges.get(challenge);
    if (!found || found.kind !== kind || (userId && found.userId !== userId)) return false;
    this.challenges.delete(challenge);
    return true;
  }

  private prune() {
    const now = Date.now();
    for (const [challenge, ceremony] of this.challenges) {
      if (ceremony.expires < now) this.challenges.delete(challenge);
    }
  }

  private transportsOf(value: string): AuthenticatorTransportFuture[] {
    return value
      .split(',')
      .filter((item): item is AuthenticatorTransportFuture => transports.includes(item as (typeof transports)[number]));
  }

  private rpId() {
    return this.config.get<string>('WEBAUTHN_RP_ID') || 'localhost';
  }

  private rpName() {
    return this.config.get<string>('WEBAUTHN_RP_NAME') || 'Paroisse Saint-Nicolas du Rhône';
  }

  private origins() {
    const configured =
      this.config.get<string>('WEBAUTHN_ORIGIN') || 'http://localhost:4200,http://127.0.0.1:4200';
    return configured
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
