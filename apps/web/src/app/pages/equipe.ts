import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { splitParagraphs } from '../core/format';
import { Person, Settings } from '../core/models';
import { parentData } from '../core/resolvers';
import { SeoService } from '../core/seo.service';

@Component({
  selector: 'app-equipe-page',
  imports: [RouterLink],
  templateUrl: './equipe.html',
})
export class EquipePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  readonly settings = parentData<Settings>(this.route, 'settings');
  readonly people = this.route.snapshot.data['people'] as Person[];
  readonly ministers = this.people.filter((person) => person.groupName === 'ministre');
  readonly curia = this.people.filter((person) => person.groupName === 'curie');
  readonly councils = splitParagraphs(this.settings.teamCouncils);

  ngOnInit() {
    this.seo.apply(
      this.settings,
      'L’équipe',
      `Curé, prêtres, diacres et curie paroissiale de ${this.settings.shortName}.`,
      '/paroisse/equipe',
    );
  }
}
