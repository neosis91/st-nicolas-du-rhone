import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormField, form as signalForm, minLength, pattern, required } from '@angular/forms/signals';
import { map, of, switchMap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { readError, slugify, slugPattern } from '../core/format';
import { AdminFormResult } from './admin-dialog';
import { FieldError } from './field-error';

function blankMinistry() {
  return { title: '', slug: '', body: '', linkLabel: '', linkUrl: '' };
}
import { CloseButton } from './close-button';
import { DeleteButton } from './delete-button';

@Component({
  selector: 'app-ministry-form',
  imports: [FormField, FieldError, CloseButton, DeleteButton],
  templateUrl: './ministry-form.html',
})
export class MinistryFormPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialogRef = inject(DialogRef<AdminFormResult>);
  private readonly data = inject<{ id: string }>(DIALOG_DATA);
  readonly error = signal('');
  readonly editingId = signal<string | null>(null);
  private sortOrder = 1;
  private readonly model = signal(blankMinistry());
  readonly form = signalForm(this.model, (path) => {
    required(path.title);
    required(path.slug);
    pattern(path.slug, slugPattern);
    required(path.body);
    minLength(path.body, 10);
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
      ...value,
      linkLabel: value.linkLabel.trim() || null,
      linkUrl: value.linkUrl.trim() || null,
    };
    const id = this.editingId();
    const order$ = id
      ? of(this.sortOrder)
      : this.api.adminMinistries().pipe(map((rows) => rows.reduce((max, row) => Math.max(max, row.sortOrder ?? 0), 0) + 1));
    order$.pipe(switchMap((sortOrder) => this.api.saveMinistry({ ...payload, sortOrder }, id ?? undefined))).subscribe({
      next: () => this.dialogRef.close('saved'),
      error: (error: unknown) => this.error.set(readError(error)),
    });
  }

  remove() {
    const id = this.editingId();
    if (!id || !confirm('Supprimer ce texte ?')) return;
    this.api.deleteMinistry(id).subscribe({ next: () => this.dialogRef.close('deleted') });
  }

  private load(id: string | null) {
    if (!id || id === 'nouveau') {
      this.editingId.set(null);
      return;
    }
    this.editingId.set(id);
    this.api.adminMinistry(id).subscribe((row) => {
      this.form().reset({
        title: row.title,
        slug: row.slug,
        body: row.body ?? '',
        linkLabel: row.linkLabel ?? '',
        linkUrl: row.linkUrl ?? '',
      });
      this.sortOrder = row.sortOrder ?? 1;
    });
  }
}
