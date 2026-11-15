import { DOCUMENT, NgOptimizedImage } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { initials } from '../core/format';
import { parentData } from '../core/resolvers';
import { Settings } from '../core/models';
import { ThemeToggle } from '../theme-toggle';

@Component({
  selector: 'app-public-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgOptimizedImage, ThemeToggle],
  templateUrl: './public-shell.html',
  host: {
    '(document:click)': 'closeAccount()',
  },
})
export class PublicShell implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  readonly auth = inject(AuthService);
  readonly initials = initials;
  readonly settings = parentData<Settings>(this.route, 'settings');
  readonly year = new Date().getFullYear();
  readonly menuOpen = signal(false);
  readonly accountOpen = signal(false);
  readonly jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CatholicChurch',
    name: this.settings.name,
    url: this.settings.siteUrl,
    logo: `${this.settings.siteUrl.replace(/\/$/, '')}/logo.png`,
    telephone: this.settings.phoneHref?.replace('tel:', '') ?? this.settings.phone,
    email: this.settings.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: this.settings.street,
      postalCode: this.settings.postalCode,
      addressLocality: this.settings.city,
      addressCountry: 'FR',
    },
    parentOrganization: {
      '@type': 'Organization',
      name: this.settings.diocese,
      url: this.settings.dioceseUrl,
    },
  });

  closeMenu() {
    this.menuOpen.set(false);
  }

  toggleMenu() {
    this.accountOpen.set(false);
    this.menuOpen.update((open) => !open);
  }

  toggleAccount(event: Event) {
    event.stopPropagation();
    this.menuOpen.set(false);
    this.accountOpen.update((open) => !open);
  }

  logout() {
    this.accountOpen.set(false);
    this.auth.logout();
  }

  closeAccount() {
    this.accountOpen.set(false);
  }

  ngOnInit() {
    this.auth.refreshProfile();
    if (this.document.querySelector('script[data-parish-jsonld]')) return;
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-parish-jsonld', '');
    script.textContent = this.jsonLd;
    this.document.head.appendChild(script);
  }
}
