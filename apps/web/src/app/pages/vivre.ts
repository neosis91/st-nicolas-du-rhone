import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Ministry, Settings } from '../core/models';
import { parentData } from '../core/resolvers';
import { SeoService } from '../core/seo.service';

@Component({
  selector: 'app-vivre-page',
  imports: [RouterLink],
  templateUrl: './vivre.html',
})
export class VivrePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  readonly settings = parentData<Settings>(this.route, 'settings');
  readonly ministries = this.route.snapshot.data['ministries'] as Ministry[];

  link(url: string): { path: string; fragment: string | undefined } {
    const [path, fragment] = url.split('#');
    return { path, fragment };
  }

  ngOnInit() {
    this.seo.apply(
      this.settings,
      'Vie paroissiale',
      `Catéchèse, catéchuménat, pastorale de la santé et Secours catholique dans la paroisse ${this.settings.shortName}.`,
      '/vivre',
    );
  }
}
