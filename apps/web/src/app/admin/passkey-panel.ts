import { Component, inject, OnInit, output, signal } from '@angular/core';
import { FormField, form as signalForm } from '@angular/forms/signals';
import { DeleteButton } from './delete-button';
import { startRegistration, WebAuthnError } from '@simplewebauthn/browser';
import { AuthService, ParishPasskey } from '../core/auth.service';
import { readError } from '../core/format';
import { ToastService } from '../core/toast';

@Component({
  selector: 'app-passkey-panel',
  imports: [FormField, DeleteButton],
  templateUrl: './passkey-panel.html',
})
export class PasskeyPanel implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  readonly securityChange = output<void>();
  readonly passkeys = signal<ParishPasskey[]>([]);
  readonly ready = signal(false);
  readonly busy = signal(false);
  readonly passwordLogin = signal(true);
  readonly offerOnly = signal(false);
  readonly error = signal('');
  private readonly model = signal({ name: '' });
  readonly form = signalForm(this.model, () => undefined);

  ngOnInit() {
    this.reload();
  }

  when(value: string) {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value));
  }

  add() {
    this.busy.set(true);
    this.error.set('');
    const name = this.form().value().name.trim();
    this.auth.preparePasskey().subscribe({
      next: (options) => {
        void startRegistration({ optionsJSON: options })
          .then((response) => {
            this.auth.registerPasskey(response, name).subscribe({
              next: (saved) => {
                this.busy.set(false);
                this.toast.show('Clé d’accès enregistrée.');
                this.offerOnly.set(!!saved.offerPasskeyOnly);
                this.form().reset({ name: '' });
                this.reload();
              },
              error: (error: unknown) => {
                this.busy.set(false);
                this.error.set(readError(error, 'La clé d’accès n’a pas pu être enregistrée.'));
              },
            });
          })
          .catch((error: unknown) => {
            this.busy.set(false);
            this.error.set(passkeyMessage(error));
          });
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.error.set(readError(error));
      },
    });
  }

  preferOnly() {
    this.busy.set(true);
    this.error.set('');
    this.auth.preferPasskeyOnly().subscribe({
      next: (account) => {
        this.busy.set(false);
        this.passwordLogin.set(account.passwordLogin);
        this.offerOnly.set(false);
        this.toast.show('Connexion par clé d’accès uniquement.');
        this.securityChange.emit();
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.error.set(readError(error));
      },
    });
  }

  dismissOffer() {
    this.offerOnly.set(false);
  }

  allowPassword() {
    this.busy.set(true);
    this.error.set('');
    this.auth.allowPasswordLogin().subscribe({
      next: (account) => {
        this.busy.set(false);
        this.passwordLogin.set(account.passwordLogin);
        this.toast.show('La connexion par mot de passe est de nouveau possible.');
        this.securityChange.emit();
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.error.set(readError(error));
      },
    });
  }

  remove(passkey: ParishPasskey) {
    if (!confirm(`Retirer la clé « ${passkey.name} » ?`)) return;
    this.auth.deletePasskey(passkey.id).subscribe({
      next: () => {
        this.toast.show('Clé d’accès retirée.');
        this.error.set('');
        this.offerOnly.set(false);
        this.reload(true);
      },
      error: (error: unknown) => this.error.set(readError(error)),
    });
  }

  private reload(emitSecurity = false) {
    this.auth.passkeys().subscribe({
      next: (rows) => {
        this.passkeys.set(rows);
        this.ready.set(true);
      },
      error: () => this.ready.set(true),
    });
    this.auth.account().subscribe({
      next: (account) => {
        this.passwordLogin.set(account.passwordLogin);
        if (!account.passwordLogin) this.offerOnly.set(false);
        if (emitSecurity) this.securityChange.emit();
      },
      error: () => undefined,
    });
  }
}

function passkeyMessage(error: unknown) {
  if (error instanceof WebAuthnError && (error.code === 'ERROR_CEREMONY_ABORTED' || error.name === 'NotAllowedError')) {
    return 'La clé d’accès n’a pas été enregistrée.';
  }
  if (error instanceof WebAuthnError && (error.code === 'ERROR_INVALID_DOMAIN' || error.code === 'ERROR_INVALID_RP_ID')) {
    return 'Ouvrez le site sur son nom de domaine pour enregistrer une clé d’accès.';
  }
  return 'La clé d’accès n’a pas pu être enregistrée.';
}
