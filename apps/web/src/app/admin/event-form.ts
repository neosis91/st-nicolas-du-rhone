import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormField, form as signalForm, minLength, required } from '@angular/forms/signals';
import { ApiService } from '../core/api.service';
import { readError, toDatetimeLocal } from '../core/format';
import { AdminFormResult } from './admin-dialog';
import { FieldError } from './field-error';

function blankEvent() {
  return {
    title: '',
    kind: 'Liturgie',
    startsAt: toDatetimeLocal(new Date().toISOString()),
    location: '',
    detail: '',
    published: true,
  };
}
import { CloseButton } from './close-button';
import { DeleteButton } from './delete-button';

@Component({
  selector: 'app-event-form',
  imports: [FormField, FieldError, CloseButton, DeleteButton],
  templateUrl: './event-form.html',
})
export class EventFormPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialogRef = inject(DialogRef<AdminFormResult>);
  private readonly data = inject<{ id: string; at?: string | null }>(DIALOG_DATA);
  readonly kinds = ['Liturgie', 'Accueil', 'Paroisse'];
  readonly error = signal('');
  readonly editingId = signal<string | null>(null);
  private readonly model = signal(blankEvent());
  readonly form = signalForm(this.model, (path) => {
    required(path.title);
    minLength(path.title, 3);
    required(path.kind);
    required(path.startsAt);
    required(path.location);
    required(path.detail);
    minLength(path.detail, 3);
  });

  ngOnInit() {
    this.load(this.data.id);
  }

  close() {
    this.dialogRef.close();
  }

  save() {
    if (this.form().invalid()) {
      this.form().markAsTouched();
      return;
    }
    const value = this.form().value();
    const payload = { ...value, startsAt: new Date(value.startsAt).toISOString() };
    const id = this.editingId();
    const request = id ? this.api.updateEvent(id, payload) : this.api.createEvent(payload);
    request.subscribe({
      next: () => this.dialogRef.close('saved'),
      error: (error: unknown) => this.error.set(readError(error)),
    });
  }

  remove() {
    const id = this.editingId();
    if (!id || !confirm('Supprimer cette date ?')) return;
    this.api.deleteEvent(id).subscribe({
      next: () => this.dialogRef.close('deleted'),
      error: (error: unknown) => this.error.set(readError(error)),
    });
  }

  private load(id: string | null) {
    if (!id || id === 'nouveau') {
      this.editingId.set(null);
      if (this.data.at) {
        this.form().reset({
          ...blankEvent(),
          startsAt: toDatetimeLocal(this.data.at),
        });
      }
      return;
    }
    this.editingId.set(id);
    this.api.adminEvent(id).subscribe((event) => {
      this.form().reset({
        title: event.title,
        kind: event.kind,
        startsAt: toDatetimeLocal(event.startsAt),
        location: event.location,
        detail: event.detail,
        published: event.published,
      });
    });
  }
}
