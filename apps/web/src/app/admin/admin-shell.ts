import { NgOptimizedImage } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { initials } from '../core/format';
import { ToastHost } from '../core/toast';
import { ThemeToggle } from '../theme-toggle';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgOptimizedImage, ThemeToggle, ToastHost],
  templateUrl: './admin-shell.html',
})
export class AdminShell {
  readonly auth = inject(AuthService);
  readonly initials = initials;
  readonly menuOpen = signal(false);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.menuOpen.set(false));
    this.auth.refreshProfile();
    this.title.setTitle('Administration — Saint-Nicolas du Rhône');
    if (this.meta.getTag('name="robots"')) {
      this.meta.updateTag({ name: 'robots', content: 'noindex,nofollow' });
    } else {
      this.meta.addTag({ name: 'robots', content: 'noindex,nofollow' });
    }
  }

  toggleMenu() {
    this.menuOpen.update((open) => !open);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }

  logout() {
    this.closeMenu();
    this.auth.logout();
  }
}
