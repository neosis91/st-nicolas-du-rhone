import { Component, inject, OnInit, RESPONSE_INIT } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Settings } from '../core/models';
import { parentData } from '../core/resolvers';
import { SeoService } from '../core/seo.service';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  templateUrl: './not-found.html',
})
export class NotFoundPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  private readonly response = inject(RESPONSE_INIT, { optional: true });
  readonly settings = parentData<Settings>(this.route, 'settings');

  ngOnInit() {
    if (this.response) this.response.status = 404;
    this.seo.apply(this.settings, 'Page introuvable', `Cette page n’existe pas sur le site de ${this.settings.name}.`, '/');
  }
}
