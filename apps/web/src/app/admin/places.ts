import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { CdkDrag, CdkDragDrop, CdkDragPreview, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, inject, OnInit, signal, TemplateRef, viewChild } from '@angular/core';
import { FormField, form as signalForm, minLength, required } from '@angular/forms/signals';
import { forkJoin } from 'rxjs';
import { ApiService } from '../core/api.service';
import { readError } from '../core/format';
import { Place } from '../core/models';
import { ToastService } from '../core/toast';

function blankPlace() {
  return { town: '', kind: 'fleuve', church: '', address: '', note: '' };
}
import { openAdminTemplate } from './admin-dialog';
import { FieldError } from './field-error';
import { CloseButton } from './close-button';
import { DeleteButton } from './delete-button';
import { EditButton } from './edit-button';
import { DragHandle } from './drag-handle';
import { reorderRows } from './reorder';

@Component({
  selector: 'app-places-admin',
  imports: [FormField, FieldError, CdkDropList, CdkDrag, CdkDragPreview, DragHandle, CloseButton, EditButton, DeleteButton],
  templateUrl: './places.html',
})
export class PlacesAdmin implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(Dialog);
  private dialogRef: DialogRef | null = null;
  private readonly editor = viewChild.required<TemplateRef<unknown>>('editor');
  readonly rows = signal<Place[]>([]);
  readonly error = signal('');
  readonly dialogOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  private readonly model = signal(blankPlace());
  readonly form = signalForm(this.model, (path) => {
    required(path.town);
    required(path.kind);
    required(path.note);
    minLength(path.note, 3);
  });

  ngOnInit() {
    this.reload();
  }

  openCreate() {
    this.reset();
    this.error.set('');
    this.openDialog();
  }

  edit(row: Place) {
    this.editingId.set(row.id);
    this.error.set('');
    this.form().reset({
      town: row.town,
      kind: row.kind,
      church: row.church ?? '',
      address: row.address ?? '',
      note: row.note,
    });
    this.openDialog();
  }

  reset() {
    this.editingId.set(null);
    this.form().reset(blankPlace());
  }

  save() {
    if (this.form().invalid()) {
      this.form().markAsTouched();
      return;
    }
    const value = this.form().value();
    const id = this.editingId();
    const current = this.rows().find((row) => row.id === id);
    const payload = {
      town: value.town,
      kind: value.kind,
      church: value.church.trim() || null,
      address: value.address.trim() || null,
      note: value.note,
      sortOrder: current?.sortOrder ?? this.nextOrder(),
    };
    this.api.savePlace(payload, id ?? undefined).subscribe({
      next: () => {
        this.toast.show('Enregistré.');
        this.error.set('');
        this.close();
        this.reload();
      },
      error: (error: unknown) => this.error.set(readError(error)),
    });
  }

  remove(row: Place) {
    if (!confirm(`Retirer ${row.town} ?`)) return;
    this.api.deletePlace(row.id).subscribe({ next: () => this.reload() });
  }

  drop(event: CdkDragDrop<Place[]>) {
    const next = reorderRows(this.rows(), event);
    if (!next) return;
    const previous = new Map(this.rows().map((row) => [row.id, row.sortOrder]));
    this.rows.set(next);
    const changed = next.filter((row) => previous.get(row.id) !== row.sortOrder);
    forkJoin(changed.map((row) => this.api.savePlace(this.payload(row, row.sortOrder), row.id))).subscribe({
      error: (error: unknown) => {
        this.error.set(readError(error));
        this.reload();
      },
    });
  }

  private payload(row: Place, sortOrder: number) {
    return {
      town: row.town,
      kind: row.kind,
      church: row.church,
      address: row.address,
      note: row.note,
      sortOrder,
    };
  }

  close() {
    this.dialogRef?.close();
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
    this.api.adminPlaces().subscribe((rows) => this.rows.set(rows));
  }

  private nextOrder() {
    return this.rows().reduce((max, row) => Math.max(max, row.sortOrder), 0) + 1;
  }
}
