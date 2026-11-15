import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Person, Sacrament, Settings } from '../core/models';
import { parentData } from '../core/resolvers';
import { SeoService } from '../core/seo.service';

@Component({
  selector: 'app-sacrements-page',
  imports: [RouterLink],
  templateUrl: './sacrements.html',
})
export class SacrementsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  readonly settings = parentData<Settings>(this.route, 'settings');
  readonly sacraments = this.route.snapshot.data['sacraments'] as Sacrament[];
  readonly contacts = (this.route.snapshot.data['people'] as Person[]).filter(
    (person) => person.showOnContact && person.phoneHref,
  );

  ngOnInit() {
    this.seo.apply(
      this.settings,
      'Sacrements',
      `Demander un baptême, un mariage, la première communion, la confirmation ou des funérailles à ${this.settings.shortName}.`,
      '/celebrer/sacrements',
    );
  }
}
