import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { formatDate, isUpcoming } from '../core/format';
import { Settings } from '../core/models';
import { HomeData, parentData } from '../core/resolvers';
import { SeoService } from '../core/seo.service';
import { RiverScene } from '../layout/river-scene';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, RiverScene],
  templateUrl: './home.html',
})
export class HomePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  readonly settings = parentData<Settings>(this.route, 'settings');
  readonly home = this.route.snapshot.data['home'] as HomeData;
  readonly latest = this.home.articles.slice(0, 3);
  readonly upcoming = this.home.events.filter((event) => isUpcoming(event.startsAt)).slice(0, 3);
  readonly sunday = this.home.masses.sunday;
  readonly formatDate = formatDate;

  ngOnInit() {
    this.seo.apply(
      this.settings,
      'Accueil',
      `${this.settings.name}, ${this.settings.diocese}. Messes, sacrements, catéchèse et accueil à ${this.settings.city} et dans les communes voisines.`,
      '/',
    );
  }
}
