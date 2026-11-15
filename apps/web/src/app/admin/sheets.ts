import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Component, computed, effect, ElementRef, inject, OnInit, signal, TemplateRef, viewChild } from '@angular/core';
import { FormField, form as signalForm, minLength, pattern, required } from '@angular/forms/signals';
import { ApiService } from '../core/api.service';
import { formatSheetPeriod, formatSize, readError } from '../core/format';
import { ParishSheet, SheetKind, SheetMaterial } from '../core/models';
import { ToastService } from '../core/toast';
import { openAdminTemplate } from './admin-dialog';
import { FieldError } from './field-error';
import { CloseButton } from './close-button';
import { DeleteButton } from './delete-button';

function blankSheet() {
  return { kind: 'week' as SheetKind, title: '', periodStart: '', published: true };
}

@Component({
  selector: 'app-sheets-admin',
  imports: [FormField, FieldError, CloseButton, DeleteButton],
  templateUrl: './sheets.html',
})
export class SheetsAdmin implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(Dialog);
  private dialogRef: DialogRef | null = null;
  private materialRequest = 0;
  private readonly editor = viewChild.required<TemplateRef<unknown>>('editor');
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  readonly rows = signal<ParishSheet[]>([]);
  readonly error = signal('');
  readonly dialogOpen = signal(false);
  readonly saving = signal(false);
  readonly file = signal<File | null>(null);
  readonly fileError = signal('');
  readonly material = signal<SheetMaterial | null>(null);
  readonly formatSheetPeriod = formatSheetPeriod;
  readonly formatSize = formatSize;
  readonly weeks = computed(() => this.rows().filter((row) => row.kind === 'week'));
  readonly months = computed(() => this.rows().filter((row) => row.kind === 'month'));
  private readonly model = signal(blankSheet());
  readonly form = signalForm(this.model, (path) => {
    required(path.kind);
    required(path.title);
    minLength(path.title, 2);
    required(path.periodStart);
    pattern(path.periodStart, /^\d{4}-\d{2}-\d{2}$/);
  });

  constructor() {
    effect(() => {
      const kind = this.form.kind().value();
      const periodStart = this.form.periodStart().value();
      const request = ++this.materialRequest;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(periodStart)) {
        this.material.set(null);
        return;
      }
      this.api.sheetMaterial(kind, periodStart).subscribe({
        next: (material) => {
          if (request === this.materialRequest) this.material.set(material);
        },
        error: () => {
          if (request === this.materialRequest) this.material.set(null);
        },
      });
    });
  }

  ngOnInit() {
    this.reload();
  }

  openCreate() {
    this.form().reset(blankSheet());
    this.file.set(null);
    this.material.set(null);
    this.error.set('');
    const input = this.fileInput()?.nativeElement;
    if (input) input.value = '';
    this.dialogOpen.set(true);
    this.dialogRef = openAdminTemplate(this.dialog, this.editor());
    this.dialogRef.closed.subscribe(() => this.dialogOpen.set(false));
  }

  close() {
    this.dialogRef?.close();
  }

  pickFile(event: Event) {
    const input = event.target as HTMLInputElement;
    this.file.set(input.files?.[0] ?? null);
    this.fileError.set('');
    this.error.set('');
  }

  save() {
    const state = this.form();
    if (state.invalid()) {
      state.markAsTouched();
      return;
    }
    const chosen = this.file();
    if (!chosen || !chosen.name.toLowerCase().endsWith('.pdf')) {
      this.fileError.set('Choisissez un fichier PDF.');
      return;
    }
    this.fileError.set('');
    const value = state.value();
    this.saving.set(true);
    this.error.set('');
    this.api
      .uploadSheet({
        kind: value.kind,
        title: value.title,
        periodStart: value.periodStart,
        published: value.published,
        file: chosen,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.show('Feuille déposée.');
          this.close();
          this.reload();
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.error.set(readError(error));
        },
      });
  }

  download(row: ParishSheet) {
    this.api.downloadAdminSheet(row.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = row.originalName;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: (error: unknown) => this.error.set(readError(error)),
    });
  }

  remove(row: ParishSheet) {
    if (!confirm(`Supprimer « ${row.title} » ?`)) return;
    this.api.deleteSheet(row.id).subscribe({
      next: () => {
        this.toast.show('Feuille supprimée.');
        this.reload();
      },
      error: (error: unknown) => this.error.set(readError(error)),
    });
  }

  private reload() {
    this.api.adminSheets().subscribe({
      next: (rows) => this.rows.set(rows),
      error: (error: unknown) => this.error.set(readError(error)),
    });
  }
}
