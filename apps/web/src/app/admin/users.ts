import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, OnInit, signal, TemplateRef, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { email, FormField, form as signalForm, maxLength, minLength, required } from '@angular/forms/signals';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { readError } from '../core/format';
import { AccountUser } from '../core/models';
import { NEW_PASSWORD_MIN, PASSWORD_MAX, newPasswordRules } from '../core/password';
import { ToastService } from '../core/toast';
import { openAdminTemplate } from './admin-dialog';
import { FieldError } from './field-error';
import { CloseButton } from './close-button';
import { DeleteButton } from './delete-button';
import { EditButton } from './edit-button';

function blankUser() {
  return { firstName: '', lastName: '', email: '', password: '' };
}

@Component({
  selector: 'app-users-admin',
  imports: [FormField, FieldError, CloseButton, EditButton, DeleteButton, RouterLink],
  templateUrl: './users.html',
})
export class UsersAdmin implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(Dialog);
  private dialogRef: DialogRef | null = null;
  private readonly editor = viewChild.required<TemplateRef<unknown>>('editor');
  readonly auth = inject(AuthService);
  readonly rows = signal<AccountUser[]>([]);
  readonly error = signal('');
  readonly dialogOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly passwordRules = newPasswordRules;
  readonly passwordAriaLabel = `Mot de passe, ${PASSWORD_MAX} caractères maximum`;
  private readonly model = signal(blankUser());
  readonly form = signalForm(this.model, (path) => {
    required(path.firstName);
    minLength(path.firstName, 2);
    required(path.lastName);
    minLength(path.lastName, 2);
    required(path.email);
    email(path.email);
    required(path.password, { when: () => this.editingId() === null });
    minLength(path.password, NEW_PASSWORD_MIN);
    maxLength(path.password, PASSWORD_MAX);
  });

  ngOnInit() {
    this.reload();
  }

  openCreate() {
    this.reset();
    this.error.set('');
    this.openDialog();
  }

  edit(row: AccountUser) {
    this.editingId.set(row.id);
    this.error.set('');
    this.form().reset({ firstName: row.firstName, lastName: row.lastName, email: row.email, password: '' });
    this.openDialog();
  }

  reset() {
    this.editingId.set(null);
    this.form().reset(blankUser());
  }

  save(event?: Event) {
    event?.preventDefault();
    this.takeFields(event);
    if (this.form().invalid()) {
      this.form().markAsTouched();
      return;
    }
    const id = this.editingId();
    const value = this.form().value();
    const body = {
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      email: value.email.trim(),
      ...(!id && value.password ? { password: value.password } : {}),
    };
    if (!id && !value.password) return;
    this.api.saveUser(body, id ?? undefined).subscribe({
      next: (user) => {
        if (user.id === this.auth.userId()) this.auth.remember(user.id, user.name);
        this.toast.show(id ? 'Compte mis à jour.' : 'Compte créé.');
        this.error.set('');
        this.close();
        this.reload();
      },
      error: (error: unknown) => this.error.set(readError(error)),
    });
  }

  remove(row: AccountUser) {
    if (row.id === this.auth.userId() || this.rows().length <= 1) return;
    if (!confirm(`Supprimer le compte de ${row.name} ?`)) return;
    this.api.deleteUser(row.id).subscribe({
      next: () => {
        if (this.editingId() === row.id) this.reset();
        this.reload();
      },
      error: (error: unknown) => this.error.set(readError(error)),
    });
  }

  close() {
    this.dialogRef?.close();
  }

  private takeFields(event?: Event) {
    const form = event?.target;
    if (!(form instanceof HTMLFormElement)) return;
    const firstName = form.querySelector('input[autocomplete="given-name"]');
    const lastName = form.querySelector('input[autocomplete="family-name"]');
    const emailInput = form.querySelector('input[type="email"]');
    const password = form.querySelector('input[type="password"]');
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
      password: password instanceof HTMLInputElement ? password.value : '',
    });
  }

  private openDialog() {
    this.dialogOpen.set(true);
    this.dialogRef = openAdminTemplate(this.dialog, this.editor());
    this.dialogRef.closed.subscribe(() => {
      this.dialogOpen.set(false);
      this.dialogRef = null;
      this.reset();
    });
  }

  private reload() {
    this.api.adminUsers().subscribe({
      next: (rows) => this.rows.set(rows),
      error: (error: unknown) => this.error.set(readError(error)),
    });
  }
}
