import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { formatDate } from '../core/format';
import { ArticleSummary, Settings } from '../core/models';
import { parentData } from '../core/resolvers';
import { SeoService } from '../core/seo.service';

@Component({
  selector: 'app-actualites-page',
  imports: [RouterLink],
  templateUrl: './actualites.html',
})
export class ActualitesPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  readonly settings = parentData<Settings>(this.route, 'settings');
  readonly articles = this.route.snapshot.data['articles'] as ArticleSummary[];
  readonly formatDate = formatDate;

  ngOnInit() {
    this.seo.apply(this.settings, 'Actualités', `Nouvelles de ${this.settings.name}.`, '/actualites');
  }
}
