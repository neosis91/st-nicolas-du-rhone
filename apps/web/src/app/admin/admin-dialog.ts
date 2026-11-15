import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/overlay';
import { DestroyRef, inject, TemplateRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

export type AdminFormResult = 'saved' | 'deleted';

function dialogOptions<D>(data?: D) {
  return {
    autoFocus: 'input, textarea, select',
    restoreFocus: true as const,
    closeOnNavigation: false,
    width: 'min(42rem, calc(100vw - 1.5rem))',
    maxWidth: 'calc(100vw - 1.5rem)',
    maxHeight: 'calc(100dvh - 2rem)',
    panelClass: 'admin-dialog-pane',
    backdropClass: 'admin-dialog-backdrop',
    ariaModal: true,
    ariaLabelledBy: 'admin-modal-title',
    data,
  };
}

export function openAdminTemplate(dialog: Dialog, template: TemplateRef<unknown>) {
  return dialog.open(template, dialogOptions());
}

export function bindRoutedForm(
  component: ComponentType<unknown>,
  listCommands: string[],
  onResult: (result: AdminFormResult) => void,
) {
  const dialog = inject(Dialog);
  const route = inject(ActivatedRoute);
  const router = inject(Router);
  const destroyRef = inject(DestroyRef);
  const superseded = new WeakSet<DialogRef<AdminFormResult>>();
  let ref: DialogRef<AdminFormResult> | null = null;
  let openedFor: string | null = null;
  let alive = true;

  const closeCurrent = () => {
    const current = ref;
    if (!current) return;
    superseded.add(current);
    ref = null;
    openedFor = null;
    current.close();
  };

  const sync = () => {
    const child = route.firstChild?.snapshot;
    const id = child?.paramMap.get('id') ?? null;
    if (!id) {
      closeCurrent();
      return;
    }
    const at = child?.queryParamMap.get('at') ?? null;
    const openKey = at ? `${id}?${at}` : id;
    if (openKey === openedFor && ref) return;
    closeCurrent();
    openedFor = openKey;
    const next = dialog.open<AdminFormResult, { id: string; at: string | null }>(
      component,
      dialogOptions({ id, at }),
    );
    ref = next;
    next.closed.pipe(takeUntilDestroyed(destroyRef)).subscribe((result) => {
      if (!alive || superseded.has(next)) return;
      ref = null;
      openedFor = null;
      if (result) onResult(result);
      if (route.firstChild?.snapshot.paramMap.get('id') === id) {
        void router.navigate(listCommands);
      }
    });
  };

  router.events
    .pipe(
      filter((event) => event instanceof NavigationEnd),
      takeUntilDestroyed(destroyRef),
    )
    .subscribe(() => sync());

  destroyRef.onDestroy(() => {
    alive = false;
    closeCurrent();
  });

  queueMicrotask(() => {
    if (alive) sync();
  });
}
