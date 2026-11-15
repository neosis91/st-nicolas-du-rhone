import { Component, input } from '@angular/core';

@Component({
  selector: 'button[appEdit]',
  template: `
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
      />
    </svg>
  `,
  host: {
    class: 'icon-btn',
    '[attr.aria-label]': 'label()',
  },
})
export class EditButton {
  readonly label = input('Modifier');
}
