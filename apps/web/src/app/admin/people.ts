import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { CdkDrag, CdkDragDrop, CdkDragPreview, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, inject, OnInit, signal, TemplateRef, viewChild } from '@angular/core';
import { FormField, form as signalForm, required } from '@angular/forms/signals';
import { forkJoin } from 'rxjs';
import { ApiService } from '../core/api.service';
import { readError } from '../core/format';
import { Person } from '../core/models';
import { ToastService } from '../core/toast';

function blankPerson() {
  return { name: '', role: '', detail: '', phone: '', email: '', groupName: 'ministre', showOnContact: false };
}
import { openAdminTemplate } from './admin-dialog';
import { FieldError } from './field-error';
import { CloseButton } from './close-button';
import { DeleteButton } from './delete-button';
import { EditButton } from './edit-button';
import { DragHandle } from './drag-handle';
import { reorderRows } from './reorder';

@Component({
  selector: 'app-people-admin',
  imports: [FormField, FieldError, CdkDropList, CdkDrag, CdkDragPreview, DragHandle, CloseButton, EditButton, DeleteButton],
  templateUrl: './people.html',
})
export class PeopleAdmin implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(Dialog);
  private dialogRef: DialogRef | null = null;
  private readonly editor = viewChild.required<TemplateRef<unknown>>('editor');
  readonly rows = signal<Person[]>([]);
  readonly error = signal('');
  readonly dialogOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  private readonly model = signal(blankPerson());
  readonly form = signalForm(this.model, (path) => {
    required(path.name);
    required(path.role);
    required(path.groupName);
  });

  ngOnInit() {
    this.reload();
  }

  openCreate() {
    this.reset();
    this.error.set('');
    this.openDialog();
  }

  edit(row: Person) {
    this.editingId.set(row.id);
    this.error.set('');
    this.form().reset({
      name: row.name,
      role: row.role,
      detail: row.detail,
      phone: row.phone ?? '',
      email: row.email ?? '',
      groupName: row.groupName,
      showOnContact: row.showOnContact,
    });
    this.openDialog();
  }

  reset() {
    this.editingId.set(null);
    this.form().reset(blankPerson());
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
      ...value,
      phone: value.phone.trim() || null,
      email: value.email.trim() || null,
      sortOrder: current?.sortOrder ?? this.nextOrder(),
    };
    this.api.savePerson(payload, id ?? undefined).subscribe({
      next: () => {
        this.toast.show('Enregistré.');
        this.error.set('');
        this.close();
        this.reload();
      },
      error: (error: unknown) => this.error.set(readError(error)),
    });
  }

  remove(row: Person) {
    if (!confirm(`Retirer ${row.name} ?`)) return;
    this.api.deletePerson(row.id).subscribe({ next: () => this.reload() });
  }

  drop(event: CdkDragDrop<Person[]>) {
    const next = reorderRows(this.rows(), event);
    if (!next) return;
    const previous = new Map(this.rows().map((row) => [row.id, row.sortOrder]));
    this.rows.set(next);
    const changed = next.filter((row) => previous.get(row.id) !== row.sortOrder);
    forkJoin(changed.map((row) => this.api.savePerson(this.payload(row, row.sortOrder), row.id))).subscribe({
      error: (error: unknown) => {
        this.error.set(readError(error));
        this.reload();
      },
    });
  }

  private payload(row: Person, sortOrder: number) {
    return {
      name: row.name,
      role: row.role,
      detail: row.detail,
      phone: row.phone,
      email: row.email,
      groupName: row.groupName,
      showOnContact: row.showOnContact,
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
    this.api.adminPeople().subscribe((rows) => this.rows.set(rows));
  }

  private nextOrder() {
    return this.rows().reduce((max, row) => Math.max(max, row.sortOrder), 0) + 1;
  }
}
