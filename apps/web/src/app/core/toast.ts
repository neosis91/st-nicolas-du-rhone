import { Component, inject, PLATFORM_ID, Service, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Service()
export class ToastService {
  private readonly platform = inject(PLATFORM_ID);
  private timer: ReturnType<typeof setTimeout> | undefined;
  readonly message = signal('');

  show(text: string, ms = 4200) {
    const value = text.trim();
    if (!value) return;
    if (this.timer) clearTimeout(this.timer);
    this.message.set(value);
    if (!isPlatformBrowser(this.platform)) return;
    this.timer = setTimeout(() => this.dismiss(), ms);
  }

  dismiss() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.message.set('');
  }
}

@Component({
  selector: 'app-toast-host',
  template: `
    @if (toast.message(); as text) {
      <div class="toast" role="status" aria-live="polite">
        <p>{{ text }}</p>
        <button type="button" class="toast-close" aria-label="Fermer" (click)="toast.dismiss()">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              fill="currentColor"
              d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
            />
          </svg>
        </button>
      </div>
    }
  `,
})
export class ToastHost {
  readonly toast = inject(ToastService);
}
