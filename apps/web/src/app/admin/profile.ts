import { Component, computed, DestroyRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { email, FormField, form as signalForm, maxLength, minLength, required } from '@angular/forms/signals';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { readError } from '../core/format';
import { AccountUser } from '../core/models';
import { CURRENT_PASSWORD_MIN, NEW_PASSWORD_MIN, PASSWORD_MAX, newPasswordRules } from '../core/password';
import { ToastService } from '../core/toast';
import { FieldError } from './field-error';
import { MfaPanel } from './mfa-panel';
import { PasskeyPanel } from './passkey-panel';

@Component({
  selector: 'app-profile-page',
  imports: [FormField, FieldError, MfaPanel, PasskeyPanel, RouterLink],
  templateUrl: './profile.html',
})
export class ProfilePage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mfaPanel = viewChild(MfaPanel);
  readonly passwordRules = newPasswordRules;
  readonly error = signal('');
  readonly passwordError = signal('');
  readonly passwordLogin = signal(true);
  readonly user = signal<AccountUser | null>(null);
  readonly isSelf = computed(() => {
    const user = this.user();
    return !!user && user.id === this.auth.userId();
  });
  readonly title = computed(() => {
    const user = this.user();
    if (!user) return 'Profil';
    return this.isSelf() ? 'Mon profil' : user.name;
  });
  private readonly model = signal({ firstName: '', lastName: '', email: '' });
  readonly form = signalForm(this.model, (path) => {
    required(path.firstName);
    minLength(path.firstName, 2);
    required(path.lastName);
    minLength(path.lastName, 2);
    required(path.email);
    email(path.email);
  });
  private readonly passwordModel = signal({ currentPassword: '', nextPassword: '' });
  readonly passwordForm = signalForm(this.passwordModel, (path) => {
    required(path.currentPassword);
    minLength(path.currentPassword, CURRENT_PASSWORD_MIN);
    maxLength(path.currentPassword, PASSWORD_MAX);
    required(path.nextPassword);
    minLength(path.nextPassword, NEW_PASSWORD_MIN);
    maxLength(path.nextPassword, PASSWORD_MAX);
  });

  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id') ?? this.auth.userId();
      if (id) this.reload(id);
    });
  }

  saveIdentity(event?: Event) {
    event?.preventDefault();
    this.takeIdentity(event);
    if (this.form().invalid()) {
      this.form().markAsTouched();
      return;
    }
    const current = this.user();
    if (!current) return;
    const value = this.form().value();
    this.api
      .saveUser(
        {
          firstName: value.firstName.trim(),
          lastName: value.lastName.trim(),
          email: value.email.trim(),
        },
        current.id,
      )
      .subscribe({
        next: (user) => {
          this.user.set(user);
          if (user.id === this.auth.userId()) this.auth.remember(user.id, user.name);
          this.toast.show('Profil enregistré.');
          this.error.set('');
        },
        error: (error: unknown) => this.error.set(readError(error)),
      });
  }

  onSecurityChange() {
    this.auth.account().subscribe({
      next: (account) => {
        this.passwordLogin.set(account.passwordLogin);
        this.mfaPanel()?.reload();
      },
      error: () => undefined,
    });
  }

  changePassword(event?: Event) {
    event?.preventDefault();
    if (!this.isSelf() || !this.passwordLogin()) return;
    this.takePassword(event);
    if (this.passwordForm().invalid()) {
      this.passwordForm().markAsTouched();
      return;
    }
    const { currentPassword, nextPassword } = this.passwordForm().value();
    this.auth.changePassword(currentPassword, nextPassword).subscribe({
      next: () => {
        this.toast.show('Mot de passe modifié.');
        this.passwordError.set('');
        this.passwordForm().reset({ currentPassword: '', nextPassword: '' });
      },
      error: (error: unknown) => this.passwordError.set(readError(error)),
    });
  }

  private reload(id: string) {
    this.error.set('');
    this.passwordError.set('');
    this.user.set(null);
    this.api.adminUsers().subscribe({
      next: (rows) => {
        const found = rows.find((row) => row.id === id);
        if (!found) {
          this.error.set('Compte introuvable.');
          return;
        }
        this.user.set(found);
        this.form().reset({ firstName: found.firstName, lastName: found.lastName, email: found.email });
        if (found.id === this.auth.userId()) {
          this.auth.account().subscribe({
            next: (account) => this.passwordLogin.set(account.passwordLogin),
            error: () => undefined,
          });
        }
      },
      error: (error: unknown) => this.error.set(readError(error)),
    });
  }

  private takeIdentity(event?: Event) {
    const form = event?.target;
    if (!(form instanceof HTMLFormElement)) return;
    const firstName = form.querySelector('input[autocomplete="given-name"]');
    const lastName = form.querySelector('input[autocomplete="family-name"]');
    const emailInput = form.querySelector('input[type="email"]');
    if (
      !(firstName instanceof HTMLInputElement) ||
      !(lastName instanceof HTMLInputElement) ||
      !(emailInput instanceof HTMLInputElement)
    ) {
      return;
    }
    this.form().reset({
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim(),
      email: emailInput.value.trim(),
    });
  }

  private takePassword(event?: Event) {
    const form = event?.target;
    if (!(form instanceof HTMLFormElement)) return;
    const current = form.querySelector('input[autocomplete="current-password"]');
    const next = form.querySelector('input[autocomplete="new-password"]');
    if (!(current instanceof HTMLInputElement) || !(next instanceof HTMLInputElement)) return;
    this.passwordForm().reset({ currentPassword: current.value, nextPassword: next.value });
  }
}
