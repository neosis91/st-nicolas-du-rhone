import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

export function reorderRows<T extends { id?: string; sortOrder?: number }>(
  rows: readonly T[],
  event: CdkDragDrop<T[]>,
): T[] | null {
  if (event.previousIndex === event.currentIndex) return null;
  const next = [...rows];
  moveItemInArray(next, event.previousIndex, event.currentIndex);
  return next.map((row, index) => ({ ...row, sortOrder: index + 1 }));
}
