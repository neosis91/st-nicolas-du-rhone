import { DOCUMENT } from '@angular/common';
import { inject, Service } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Settings } from './models';

@Service()
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  apply(settings: Settings, pageTitle: string, description: string, path: string) {
    const full =
      path === '/'
        ? `${settings.name} — ${settings.diocese}`
        : `${pageTitle} — ${settings.shortName}`;
    const origin = settings.siteUrl.replace(/\/$/, '');
    const canonical = `${origin}${path}`;
    this.title.setTitle(full);
    this.upsert({ name: 'description', content: description });
    this.upsert({ name: 'robots', content: 'index,follow' });
    this.upsert({ property: 'og:title', content: full });
    this.upsert({ property: 'og:description', content: description });
    this.upsert({ property: 'og:url', content: canonical });
    this.upsert({ property: 'og:type', content: 'website' });
    this.upsert({ property: 'og:locale', content: 'fr_FR' });
    this.upsert({ property: 'og:image', content: `${origin}/og.png` });
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', canonical);
  }

  private upsert(definition: { name?: string; property?: string; content: string }) {
    const selector = definition.name ? `name="${definition.name}"` : `property="${definition.property}"`;
    if (this.meta.getTag(selector)) this.meta.updateTag(definition);
    else this.meta.addTag(definition);
  }
}
