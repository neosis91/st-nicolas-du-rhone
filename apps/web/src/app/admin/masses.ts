import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { CdkDrag, CdkDragDrop, CdkDragPreview, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, inject, OnInit, signal, TemplateRef, viewChild } from '@angular/core';
import { FormField, form as signalForm, required } from '@angular/forms/signals';
import { forkJoin } from 'rxjs';
import { ApiService } from '../core/api.service';
import { readError } from '../core/format';
import { MassTime } from '../core/models';
import { ToastService } from '../core/toast';

function blankMass() {
  return { dayLabel: '', time: '', location: '', note: '', period: 'sunday' };
}
import { openAdminTemplate } from './admin-dialog';
import { FieldError } from './field-error';
import { CloseButton } from './close-button';
import { DeleteButton } from './delete-button';
import { EditButton } from './edit-button';
import { DragHandle } from './drag-handle';
import { reorderRows } from './reorder';

@Component({
  selector: 'app-masses-admin',
  imports: [FormField, FieldError, CdkDropList, CdkDrag, CdkDragPreview, DragHandle, CloseButton, EditButton, DeleteButton],
  templateUrl: './masses.html',
})
export class MassesAdmin implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(Dialog);
  private dialogRef: DialogRef | null = null;
  private readonly editor = viewChild.required<TemplateRef<unknown>>('editor');
  readonly rows = signal<MassTime[]>([]);
  readonly error = signal('');
  readonly dialogOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  private readonly model = signal(blankMass());
  readonly form = signalForm(this.model, (path) => {
    required(path.dayLabel);
    required(path.time);
    required(path.location);
    required(path.period);
  });

  ngOnInit() {
    this.reload();
  }

  openCreate() {
    this.reset();
    this.error.set('');
    this.openDialog();
  }

  edit(row: MassTime) {
    this.editingId.set(row.id);
    this.error.set('');
    this.form().reset({
      dayLabel: row.dayLabel,
      time: row.time,
      location: row.location,
      note: row.note,
      period: row.period,
    });
    this.openDialog();
  }

  reset() {
    this.editingId.set(null);
    this.form().reset(blankMass());
  }

  save() {
    if (this.form().invalid()) {
      this.form().markAsTouched();
      return;
    }
    const value = this.form().value();
    const id = this.editingId();
    const current = this.rows().find((row) => row.id === id);
    const sortOrder = current?.sortOrder ?? this.nextOrder();
    this.api.saveMass({ ...value, sortOrder }, id ?? undefined).subscribe({
      next: () => {
        this.toast.show('Enregistré.');
        this.error.set('');
        this.close();
        this.reload();
      },
      error: (error: unknown) => this.error.set(readError(error)),
    });
  }

  remove(row: MassTime) {
    if (!confirm(`Supprimer l’horaire du ${row.dayLabel} ?`)) return;
    this.api.deleteMass(row.id).subscribe({ next: () => this.reload() });
  }

  drop(event: CdkDragDrop<MassTime[]>) {
    const next = reorderRows(this.rows(), event);
    if (!next) return;
    const previous = new Map(this.rows().map((row) => [row.id, row.sortOrder]));
    this.rows.set(next);
    const changed = next.filter((row) => previous.get(row.id) !== row.sortOrder);
    forkJoin(changed.map((row) => this.api.saveMass(this.payload(row, row.sortOrder), row.id))).subscribe({
      error: (error: unknown) => {
        this.error.set(readError(error));
        this.reload();
      },
    });
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
    this.api.adminMasses().subscribe((rows) => this.rows.set(rows));
  }

  private nextOrder() {
    return this.rows().reduce((max, row) => Math.max(max, row.sortOrder), 0) + 1;
  }

  private payload(row: MassTime, sortOrder: number) {
    return {
      dayLabel: row.dayLabel,
      time: row.time,
      location: row.location,
      note: row.note,
      period: row.period,
      sortOrder,
    };
  }
}
