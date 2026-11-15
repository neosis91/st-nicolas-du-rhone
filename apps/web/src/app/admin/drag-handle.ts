import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { Component, input } from '@angular/core';

@Component({
  selector: 'button[appDragHandle]',
  hostDirectives: [CdkDragHandle],
  template: `
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
      />
    </svg>
  `,
  host: {
    type: 'button',
    class: 'drag-handle',
    '[attr.aria-label]': 'label()',
  },
})
export class DragHandle {
  readonly label = input('Déplacer');
}
