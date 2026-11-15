import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { splitParagraphs } from '../core/format';
import { Place, Settings } from '../core/models';
import { parentData } from '../core/resolvers';
import { SeoService } from '../core/seo.service';

@Component({
  selector: 'app-paroisse-page',
  imports: [RouterLink],
  templateUrl: './paroisse.html',
})
export class ParoissePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  readonly settings = parentData<Settings>(this.route, 'settings');
  readonly places = this.route.snapshot.data['places'] as Place[];
  readonly valley = this.places.filter((place) => place.kind === 'fleuve');
  readonly hills = this.places.filter((place) => place.kind === 'coteaux');
  readonly about = splitParagraphs(this.settings.aboutText);

  ngOnInit() {
    this.seo.apply(
      this.settings,
      'La paroisse',
      `${this.settings.name} rassemble dix communes d’Ardèche, dans le ${this.settings.diocese}.`,
      '/paroisse',
    );
  }
}
