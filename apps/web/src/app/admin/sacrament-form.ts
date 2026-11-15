import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormField, form as signalForm, minLength, pattern, required } from '@angular/forms/signals';
import { map, of, switchMap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { readError, slugify, slugPattern } from '../core/format';
import { AdminFormResult } from './admin-dialog';
import { FieldError } from './field-error';

function blankSacrament() {
  return { title: '', slug: '', text: '', stepsText: '' };
}
import { CloseButton } from './close-button';
import { DeleteButton } from './delete-button';

@Component({
  selector: 'app-sacrament-form',
  imports: [FormField, FieldError, CloseButton, DeleteButton],
  templateUrl: './sacrament-form.html',
})
export class SacramentFormPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialogRef = inject(DialogRef<AdminFormResult>);
  private readonly data = inject<{ id: string }>(DIALOG_DATA);
  readonly error = signal('');
  readonly editingId = signal<string | null>(null);
  private sortOrder = 1;
  private readonly model = signal(blankSacrament());
  readonly form = signalForm(this.model, (path) => {
    required(path.title);
    required(path.slug);
    pattern(path.slug, slugPattern);
    required(path.text);
    minLength(path.text, 10);
    required(path.stepsText);
  });

  ngOnInit() {
    this.load(this.data.id);
  }

  close() {
    this.dialogRef.close();
  }

  fillSlug() {
    if (this.form.slug().value().trim()) return;
    this.form.slug().value.set(slugify(this.form.title().value()));
  }

  save() {
    this.fillSlug();
    if (this.form().invalid()) {
      this.form().markAsTouched();
      return;
    }
    const value = this.form().value();
    const payload = {
      title: value.title,
      slug: value.slug,
      text: value.text,
      steps: value.stepsText.split('\n').map((step) => step.trim()).filter(Boolean),
    };
    const id = this.editingId();
    const order$ = id
      ? of(this.sortOrder)
      : this.api.adminSacraments().pipe(map((rows) => rows.reduce((max, row) => Math.max(max, row.sortOrder ?? 0), 0) + 1));
    order$.pipe(switchMap((sortOrder) => this.api.saveSacrament({ ...payload, sortOrder }, id ?? undefined))).subscribe({
      next: () => this.dialogRef.close('saved'),
      error: (error: unknown) => this.error.set(readError(error)),
    });
  }

  remove() {
    const id = this.editingId();
    if (!id || !confirm('Supprimer cette page ?')) return;
    this.api.deleteSacrament(id).subscribe({ next: () => this.dialogRef.close('deleted') });
  }

  private load(id: string | null) {
    if (!id || id === 'nouveau') {
      this.editingId.set(null);
      return;
    }
    this.editingId.set(id);
    this.api.adminSacrament(id).subscribe((row) => {
      this.form().reset({
        title: row.title,
        slug: row.slug,
        text: row.text,
        stepsText: row.steps.join('\n'),
      });
      this.sortOrder = row.sortOrder ?? 1;
    });
  }
}
