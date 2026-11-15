import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DisableMfaDto, LoginDto, MfaCodeDto, MfaDto, PasswordDto } from './dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthUser } from './jwt.strategy';
import { PasskeyService } from './passkey.service';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly passkeys: PasskeyService,
  ) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('mfa')
  verifyMfa(@Body() dto: MfaDto) {
    return this.auth.verifyMfa(dto);
  }

  @Post('mfa/preparer')
  @UseGuards(JwtAuthGuard)
  prepareMfa(@Req() request: { user: AuthUser }) {
    return this.auth.prepareMfa(request.user.id);
  }

  @Post('mfa/activer')
  @UseGuards(JwtAuthGuard)
  enableMfa(@Req() request: { user: AuthUser }, @Body() dto: MfaCodeDto) {
    return this.auth.enableMfa(request.user.id, dto);
  }

  @Post('mfa/desactiver')
  @UseGuards(JwtAuthGuard)
  disableMfa(@Req() request: { user: AuthUser }, @Body() dto: DisableMfaDto) {
    return this.auth.disableMfa(request.user.id, dto);
  }

  @Get('passkey')
  @UseGuards(JwtAuthGuard)
  listPasskeys(@Req() request: { user: AuthUser }) {
    return this.passkeys.list(request.user.id);
  }

  @Post('passkey/preparer')
  @UseGuards(JwtAuthGuard)
  preparePasskey(@Req() request: { user: AuthUser }) {
    return this.passkeys.prepareRegistration(request.user.id);
  }

  @Post('passkey/enregistrer')
  @UseGuards(JwtAuthGuard)
  registerPasskey(@Req() request: { user: AuthUser }, @Body() body: unknown) {
    return this.passkeys.register(request.user.id, body);
  }

  @Delete('passkey/:id')
  @UseGuards(JwtAuthGuard)
  removePasskey(@Req() request: { user: AuthUser }, @Param('id') id: string) {
    return this.passkeys.remove(request.user.id, id);
  }

  @Post('passkey/seul')
  @UseGuards(JwtAuthGuard)
  preferPasskeyOnly(@Req() request: { user: AuthUser }) {
    return this.auth.preferPasskeyOnly(request.user.id);
  }

  @Post('passkey/avec-mot-de-passe')
  @UseGuards(JwtAuthGuard)
  allowPasswordLogin(@Req() request: { user: AuthUser }) {
    return this.auth.allowPasswordLogin(request.user.id);
  }

  @Post('passkey/options')
  passkeyOptions() {
    return this.passkeys.prepareLogin();
  }

  @Post('passkey/verifier')
  verifyPasskey(@Body() body: unknown) {
    return this.passkeys.login(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: { user: AuthUser }) {
    return this.auth.me(request.user.id);
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  changePassword(@Req() request: { user: AuthUser }, @Body() dto: PasswordDto) {
    return this.auth.changePassword(request.user.id, dto);
  }
}
