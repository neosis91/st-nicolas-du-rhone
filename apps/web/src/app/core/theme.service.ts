import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID, Service } from '@angular/core';

const STORAGE_KEY = 'stnicolas.theme';

@Service()
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;
    const stored = localStorage.getItem(STORAGE_KEY);
    const theme = stored === 'dark' || stored === 'light' ? stored : 'light';
    this.apply(theme);
  }

  toggle() {
    const next = this.document.documentElement.dataset['theme'] === 'dark' ? 'light' : 'dark';
    this.apply(next);
    if (isPlatformBrowser(this.platformId)) localStorage.setItem(STORAGE_KEY, next);
  }

  private apply(theme: 'light' | 'dark') {
    this.document.documentElement.dataset['theme'] = theme;
    this.document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#07141f' : '#005088');
  }
}
