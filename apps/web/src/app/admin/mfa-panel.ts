import { Component, inject, OnInit, signal } from '@angular/core';
import { FormField, form as signalForm, maxLength, minLength, required } from '@angular/forms/signals';
import { FieldError } from './field-error';
import { AuthService } from '../core/auth.service';
import { readError } from '../core/format';
import { CURRENT_PASSWORD_MIN, PASSWORD_MAX } from '../core/password';
import { ToastService } from '../core/toast';

@Component({
  selector: 'app-mfa-panel',
  imports: [FormField, FieldError],
  templateUrl: './mfa-panel.html',
})
export class MfaPanel implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  readonly enabled = signal(false);
  readonly passwordLogin = signal(true);
  readonly ready = signal(false);
  readonly setup = signal<{ secret: string; qr: string } | null>(null);
  readonly recovery = signal<string[]>([]);
  readonly error = signal('');
  private readonly codeModel = signal({ code: '' });
  readonly codeForm = signalForm(this.codeModel, (path) => {
    required(path.code);
    minLength(path.code, 6);
  });
  private readonly disableModel = signal({ password: '', code: '' });
  readonly disableForm = signalForm(this.disableModel, (path) => {
    required(path.password);
    minLength(path.password, CURRENT_PASSWORD_MIN);
    maxLength(path.password, PASSWORD_MAX);
    required(path.code);
    minLength(path.code, 6);
  });

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.auth.account().subscribe({
      next: (account) => {
        this.enabled.set(account.mfaEnabled);
        this.passwordLogin.set(account.passwordLogin);
        if (!account.passwordLogin) {
          this.setup.set(null);
          this.recovery.set([]);
        }
        this.ready.set(true);
      },
      error: () => this.ready.set(true),
    });
  }

  prepare() {
    this.error.set('');
    this.recovery.set([]);
    this.auth.prepareMfa().subscribe({
      next: (setup) => {
        this.setup.set(setup);
        this.codeForm().reset({ code: '' });
      },
      error: (error: unknown) => this.error.set(readError(error)),
    });
  }

  enable() {
    if (this.codeForm().invalid()) {
      this.codeForm().markAsTouched();
      return;
    }
    this.auth.enableMfa(this.codeForm().value().code.trim()).subscribe({
      next: (result) => {
        this.enabled.set(true);
        this.setup.set(null);
        this.recovery.set(result.recoveryCodes);
        this.toast.show('La double authentification est active.');
        this.error.set('');
        this.codeForm().reset({ code: '' });
      },
      error: (error: unknown) => this.error.set(readError(error, 'Code incorrect.')),
    });
  }

  disable() {
    if (this.disableForm().invalid()) {
      this.disableForm().markAsTouched();
      return;
    }
    const { password, code } = this.disableForm().value();
    this.auth.disableMfa(password, code.trim()).subscribe({
      next: () => {
        this.enabled.set(false);
        this.recovery.set([]);
        this.toast.show('La double authentification est désactivée.');
        this.error.set('');
        this.disableForm().reset({ password: '', code: '' });
      },
      error: (error: unknown) => this.error.set(readError(error)),
    });
  }
}
