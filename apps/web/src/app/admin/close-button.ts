import { Component } from '@angular/core';

@Component({
  selector: 'button[appClose]',
  template: `
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        fill="currentColor"
        d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
      />
    </svg>
  `,
  host: {
    type: 'button',
    class: 'modal-close',
    'aria-label': 'Fermer',
  },
})
export class CloseButton {}
