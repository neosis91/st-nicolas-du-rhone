import { Component, inject, OnInit, RESPONSE_INIT } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { formatDate } from '../core/format';
import { Article, Settings } from '../core/models';
import { parentData } from '../core/resolvers';
import { SeoService } from '../core/seo.service';

@Component({
  selector: 'app-article-page',
  imports: [RouterLink],
  templateUrl: './article.html',
})
export class ArticlePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  private readonly response = inject(RESPONSE_INIT, { optional: true });
  readonly settings = parentData<Settings>(this.route, 'settings');
  readonly article = this.route.snapshot.data['article'] as Article | null;
  readonly formatDate = formatDate;

  ngOnInit() {
    if (!this.article) {
      if (this.response) this.response.status = 404;
      this.seo.apply(this.settings, 'Actualité introuvable', 'Cette actualité n’existe pas.', '/actualites');
      return;
    }
    this.seo.apply(this.settings, this.article.title, this.article.excerpt, `/actualites/${this.article.slug}`);
  }
}
