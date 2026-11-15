import { NgOptimizedImage } from '@angular/common';
import { afterNextRender, Component, inject, signal } from '@angular/core';
import { email, FormField, form as signalForm, maxLength, minLength, required } from '@angular/forms/signals';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import {
  browserSupportsWebAuthn,
  startAuthentication,
  WebAuthnAbortService,
  WebAuthnError,
  type PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';
import { AuthService } from '../core/auth.service';
import { CURRENT_PASSWORD_MIN, PASSWORD_MAX } from '../core/password';
import { FieldError } from './field-error';
import { ThemeToggle } from '../theme-toggle';
import { readError } from '../core/format';

@Component({
  selector: 'app-login-page',
  imports: [FormField, FieldError, RouterLink, NgOptimizedImage, ThemeToggle],
  templateUrl: './login.html',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly error = signal('');
  readonly sending = signal(false);
  readonly passkeySupported = signal(false);
  readonly step = signal<'password' | 'code'>('password');
  private readonly ticket = signal('');
  private loginOptions: PublicKeyCredentialRequestOptionsJSON | null = null;
  private readonly model = signal({ email: '', password: '' });
  readonly form = signalForm(this.model, (path) => {
    required(path.email);
    email(path.email);
    required(path.password);
    minLength(path.password, CURRENT_PASSWORD_MIN);
    maxLength(path.password, PASSWORD_MAX);
  });
  private readonly codeModel = signal({ code: '' });
  readonly codeForm = signalForm(this.codeModel, (path) => {
    required(path.code);
    minLength(path.code, 6);
  });

  constructor() {
    inject(Title).setTitle('Connexion — Saint-Nicolas du Rhône');
    if (this.auth.token()) void this.router.navigateByUrl('/admin');
    afterNextRender(() => {
      this.passkeySupported.set(browserSupportsWebAuthn());
      this.preparePasskey(true);
    });
  }

  submit(event?: Event) {
    event?.preventDefault();
    if (this.step() === 'code') {
      this.takeCode(event);
      this.submitCode();
      return;
    }
    this.takeCredentials(event);
    if (this.form().invalid()) {
      this.form().markAsTouched();
      return;
    }
    WebAuthnAbortService.cancelCeremony();
    this.sending.set(true);
    this.error.set('');
    const { email, password } = this.form().value();
    this.auth.login(email, password).subscribe({
      next: (response) => {
        this.sending.set(false);
        if ('mfaRequired' in response && response.mfaRequired) {
          this.ticket.set(response.ticket);
          this.step.set('code');
          this.codeForm().reset({ code: '' });
          return;
        }
        void this.router.navigateByUrl('/admin');
      },
      error: (error: unknown) => {
        this.sending.set(false);
        this.error.set(readError(error, 'Identifiants incorrects.'));
      },
    });
  }

  back() {
    this.step.set('password');
    this.ticket.set('');
    this.error.set('');
    this.codeForm().reset({ code: '' });
  }

  passkey() {
    if (this.sending()) return;
    const ready = this.loginOptions;
    this.loginOptions = null;
    WebAuthnAbortService.cancelCeremony();
    this.sending.set(true);
    this.error.set('');
    if (ready) {
      void this.beginPasskey(ready);
      return;
    }
    this.auth.passkeyOptions().subscribe({
      next: (options) => {
        void this.beginPasskey(options);
      },
      error: (error: unknown) => {
        this.sending.set(false);
        this.error.set(readError(error, 'La clé d’accès n’a pas pu être vérifiée.'));
      },
    });
  }

  private preparePasskey(autofill: boolean) {
    if (!this.passkeySupported() || this.auth.token() || this.step() !== 'password') return;
    this.auth.passkeyOptions().subscribe({
      next: (options) => {
        this.loginOptions = options;
        if (!autofill || this.auth.token()) return;
        void startAuthentication({ optionsJSON: options, useBrowserAutofill: true })
          .then((response) => this.finishPasskey(response))
          .catch(() => undefined);
      },
      error: () => undefined,
    });
  }

  private beginPasskey(options: PublicKeyCredentialRequestOptionsJSON) {
    void startAuthentication({ optionsJSON: options })
      .then((response) => this.finishPasskey(response))
      .catch((error: unknown) => {
        this.sending.set(false);
        this.error.set(passkeyMessage(error));
        this.preparePasskey(false);
      });
  }

  private finishPasskey(response: Parameters<AuthService['verifyPasskey']>[0]) {
    this.auth.verifyPasskey(response).subscribe({
      next: () => void this.router.navigateByUrl('/admin'),
      error: (error: unknown) => {
        this.sending.set(false);
        this.error.set(readError(error, 'Clé d’accès refusée.'));
      },
    });
  }

  private takeCredentials(event?: Event) {
    const form = event?.target;
    if (!(form instanceof HTMLFormElement)) return;
    const email = form.querySelector('input[type="email"]');
    const password = form.querySelector('input[type="password"]');
    if (!(email instanceof HTMLInputElement) || !(password instanceof HTMLInputElement)) return;
    this.form().reset({ email: email.value.trim(), password: password.value });
  }

  private takeCode(event?: Event) {
    const form = event?.target;
    if (!(form instanceof HTMLFormElement)) return;
    const code = form.querySelector('input[autocomplete="one-time-code"]');
    if (!(code instanceof HTMLInputElement)) return;
    this.codeForm().reset({ code: code.value.trim() });
  }

  private submitCode() {
    if (this.codeForm().invalid()) {
      this.codeForm().markAsTouched();
      return;
    }
    this.sending.set(true);
    this.error.set('');
    this.auth.verifyMfa(this.ticket(), this.codeForm().value().code.trim()).subscribe({
      next: () => void this.router.navigateByUrl('/admin'),
      error: (error: unknown) => {
        this.sending.set(false);
        this.error.set(readError(error, 'Code incorrect.'));
      },
    });
  }
}

function passkeyMessage(error: unknown) {
  if (error instanceof WebAuthnError && error.code === 'ERROR_CEREMONY_ABORTED') {
    return 'La clé d’accès n’a pas été utilisée.';
  }
  if (error instanceof WebAuthnError && error.code === 'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY') {
    return 'La clé d’accès n’a pas pu être confirmée. Réessayez.';
  }
  if (error instanceof WebAuthnError && (error.code === 'ERROR_INVALID_DOMAIN' || error.code === 'ERROR_INVALID_RP_ID')) {
    return 'Ouvrez le site sur son nom de domaine pour utiliser une clé d’accès.';
  }
  return 'La clé d’accès n’a pas pu être vérifiée.';
}
