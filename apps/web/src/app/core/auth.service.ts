import { HttpClient } from '@angular/common/http';
import { inject, PLATFORM_ID, Service, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import type { AuthenticationResponseJSON, PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON, RegistrationResponseJSON } from '@simplewebauthn/browser';
import { API_ORIGIN } from './api-origin';

export type ParishPasskey = { id: string; name: string; backedUp: boolean; createdAt: string };

export type AccountSecurity = {
  id: string;
  name: string;
  email?: string;
  mfaEnabled: boolean;
  passwordLogin: boolean;
  passkeyCount: number;
};

type LoginResult =
  | { mfaRequired: true; ticket: string }
  | { accessToken: string; id: string; name: string; email: string };

type PasskeyRegistration = ParishPasskey & { offerPasskeyOnly?: boolean };

const TOKEN_KEY = 'stnicolas.token';
const NAME_KEY = 'stnicolas.name';
const ID_KEY = 'stnicolas.id';

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly origin = inject(API_ORIGIN);
  private readonly platform = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  readonly token = signal<string | null>(this.read(TOKEN_KEY));
  readonly name = signal<string | null>(this.read(NAME_KEY));
  readonly userId = signal<string | null>(this.read(ID_KEY));

  login(email: string, password: string) {
    return this.http
      .post<LoginResult>(`${this.origin}/api/auth/login`, { email, password })
      .pipe(tap((response) => this.keep(response)));
  }

  verifyMfa(ticket: string, code: string) {
    return this.http
      .post<LoginResult>(`${this.origin}/api/auth/mfa`, { ticket, code })
      .pipe(tap((response) => this.keep(response)));
  }

  prepareMfa() {
    return this.http.post<{ secret: string; qr: string }>(`${this.origin}/api/auth/mfa/preparer`, {});
  }

  enableMfa(code: string) {
    return this.http.post<{ enabled: boolean; recoveryCodes: string[] }>(`${this.origin}/api/auth/mfa/activer`, { code });
  }

  disableMfa(password: string, code: string) {
    return this.http.post<{ enabled: boolean }>(`${this.origin}/api/auth/mfa/desactiver`, { password, code });
  }

  account() {
    return this.http.get<AccountSecurity>(`${this.origin}/api/auth/me`);
  }

  passkeys() {
    return this.http.get<ParishPasskey[]>(`${this.origin}/api/auth/passkey`);
  }

  preparePasskey() {
    return this.http.post<PublicKeyCredentialCreationOptionsJSON>(`${this.origin}/api/auth/passkey/preparer`, {});
  }

  registerPasskey(response: RegistrationResponseJSON, name: string) {
    return this.http.post<PasskeyRegistration>(`${this.origin}/api/auth/passkey/enregistrer`, { response, name });
  }

  preferPasskeyOnly() {
    return this.http.post<AccountSecurity>(`${this.origin}/api/auth/passkey/seul`, {});
  }

  allowPasswordLogin() {
    return this.http.post<AccountSecurity>(`${this.origin}/api/auth/passkey/avec-mot-de-passe`, {});
  }

  deletePasskey(id: string) {
    return this.http.delete<{ ok: boolean }>(`${this.origin}/api/auth/passkey/${id}`);
  }

  passkeyOptions() {
    return this.http.post<PublicKeyCredentialRequestOptionsJSON>(`${this.origin}/api/auth/passkey/options`, {});
  }

  verifyPasskey(response: AuthenticationResponseJSON) {
    return this.http
      .post<LoginResult>(`${this.origin}/api/auth/passkey/verifier`, { response })
      .pipe(tap((result) => this.keep(result)));
  }

  refreshProfile() {
    if (!isPlatformBrowser(this.platform) || !this.token()) return;
    this.http.get<{ id: string; name: string }>(`${this.origin}/api/auth/me`).subscribe({
      next: (user) => {
        if (this.token()) this.remember(user.id, user.name);
      },
      error: () => undefined,
    });
  }

  remember(id: string, name: string) {
    this.userId.set(id);
    this.name.set(name);
    if (!isPlatformBrowser(this.platform)) return;
    localStorage.setItem(ID_KEY, id);
    localStorage.setItem(NAME_KEY, name);
  }

  changePassword(currentPassword: string, nextPassword: string) {
    return this.http.patch<{ ok: boolean }>(`${this.origin}/api/auth/password`, {
      currentPassword,
      nextPassword,
    });
  }

  logout() {
    this.clear();
    void this.router.navigateByUrl('/admin/connexion');
  }

  clear() {
    this.token.set(null);
    this.name.set(null);
    this.userId.set(null);
    if (!isPlatformBrowser(this.platform)) return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(NAME_KEY);
    localStorage.removeItem(ID_KEY);
  }

  private keep(response: LoginResult) {
    if ('accessToken' in response) this.persist(response.accessToken, response.name, response.id);
  }

  private persist(token: string, name: string, id: string) {
    this.token.set(token);
    this.remember(id, name);
    if (!isPlatformBrowser(this.platform)) return;
    localStorage.setItem(TOKEN_KEY, token);
  }

  private read(key: string): string | null {
    if (!isPlatformBrowser(this.platform)) return null;
    return localStorage.getItem(key);
  }
}
