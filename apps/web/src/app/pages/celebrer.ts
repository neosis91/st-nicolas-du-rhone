import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MassSchedule, Place, Settings } from '../core/models';
import { parentData } from '../core/resolvers';
import { SeoService } from '../core/seo.service';

@Component({
  selector: 'app-celebrer-page',
  imports: [RouterLink],
  templateUrl: './celebrer.html',
})
export class CelebrerPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  readonly settings = parentData<Settings>(this.route, 'settings');
  readonly celebrer = this.route.snapshot.data['celebrer'] as { masses: MassSchedule; places: Place[] };
  readonly churches = this.celebrer.places.filter((place) => place.church);

  ngOnInit() {
    this.seo.apply(
      this.settings,
      'Horaires des messes',
      `Messes dominicales et messes de la semaine dans la paroisse ${this.settings.shortName}.`,
      '/celebrer',
    );
  }
}
