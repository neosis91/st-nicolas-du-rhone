import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Settings } from '../core/models';
import { parentData } from '../core/resolvers';
import { SeoService } from '../core/seo.service';

@Component({
  selector: 'app-don-page',
  imports: [RouterLink],
  templateUrl: './don.html',
})
export class DonPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  readonly settings = parentData<Settings>(this.route, 'settings');

  ngOnInit() {
    this.seo.apply(
      this.settings,
      'Je donne',
      `Soutenir ${this.settings.name} par le denier de l’Église, la quête ou un don.`,
      '/don',
    );
  }
}
