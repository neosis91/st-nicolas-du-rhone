import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Settings } from '../core/models';
import { parentData } from '../core/resolvers';
import { SeoService } from '../core/seo.service';

@Component({
  selector: 'app-mentions-page',
  imports: [RouterLink],
  templateUrl: './mentions.html',
})
export class MentionsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  readonly settings = parentData<Settings>(this.route, 'settings');

  ngOnInit() {
    this.seo.apply(this.settings, 'Mentions légales', `Mentions légales du site de ${this.settings.name}.`, '/mentions-legales');
  }
}
