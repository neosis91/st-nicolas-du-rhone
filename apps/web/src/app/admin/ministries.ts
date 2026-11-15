import { CdkDrag, CdkDragDrop, CdkDragPreview, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../core/api.service';
import { readError } from '../core/format';
import { Ministry } from '../core/models';
import { ToastService } from '../core/toast';
import { bindRoutedForm } from './admin-dialog';
import { DragHandle } from './drag-handle';
import { EditButton } from './edit-button';
import { reorderRows } from './reorder';
import { MinistryFormPage } from './ministry-form';

@Component({
  selector: 'app-ministries-admin',
  imports: [RouterLink, RouterOutlet, CdkDropList, CdkDrag, CdkDragPreview, DragHandle, EditButton],
  templateUrl: './ministries.html',
})
export class MinistriesAdmin implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly rows = signal<Ministry[]>([]);
  readonly error = signal('');

  constructor() {
    bindRoutedForm(MinistryFormPage, ['/admin/services'], (result) => {
      this.toast.show(result === 'deleted' ? 'Supprimé.' : 'Enregistré.');
      this.reload();
    });
  }

  ngOnInit() {
    this.reload();
  }

  drop(event: CdkDragDrop<Ministry[]>) {
    const next = reorderRows(this.rows(), event);
    if (!next) return;
    const previous = new Map(this.rows().map((row) => [row.id, row.sortOrder]));
    this.rows.set(next);
    const changed = next.filter((row) => row.id && previous.get(row.id) !== row.sortOrder);
    forkJoin(
      changed.map((row) =>
        this.api.saveMinistry(
          {
            title: row.title,
            slug: row.slug,
            body: row.body ?? '',
            linkLabel: row.linkLabel,
            linkUrl: row.linkUrl,
            sortOrder: row.sortOrder,
          },
          row.id,
        ),
      ),
    ).subscribe({
      error: (error: unknown) => {
        this.error.set(readError(error));
        this.reload();
      },
    });
  }

  private reload() {
    this.api.adminMinistries().subscribe((rows) => this.rows.set(rows));
  }
}
