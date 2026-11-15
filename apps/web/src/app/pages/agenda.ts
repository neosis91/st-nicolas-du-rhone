import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { formatDate, isUpcoming } from '../core/format';
import { ParishEvent, Settings } from '../core/models';
import { parentData } from '../core/resolvers';
import { SeoService } from '../core/seo.service';

@Component({
  selector: 'app-agenda-page',
  imports: [RouterLink],
  templateUrl: './agenda.html',
})
export class AgendaPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  readonly settings = parentData<Settings>(this.route, 'settings');
  readonly upcoming = (this.route.snapshot.data['events'] as ParishEvent[]).filter((item) =>
    isUpcoming(item.startsAt),
  );
  readonly formatDate = formatDate;

  ngOnInit() {
    this.seo.apply(
      this.settings,
      'Agenda',
      `Dates liturgiques et permanences du secrétariat de ${this.settings.shortName}.`,
      '/agenda',
    );
  }
}
