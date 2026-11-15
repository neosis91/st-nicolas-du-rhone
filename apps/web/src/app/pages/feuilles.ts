import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { formatSheetPeriod, formatSize } from '../core/format';
import { ParishSheet, Settings } from '../core/models';
import { parentData } from '../core/resolvers';
import { SeoService } from '../core/seo.service';

@Component({
  selector: 'app-feuilles-page',
  imports: [RouterLink],
  templateUrl: './feuilles.html',
})
export class FeuillesPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  readonly settings = parentData<Settings>(this.route, 'settings');
  readonly sheets = this.route.snapshot.data['sheets'] as ParishSheet[];
  readonly weeks = this.sheets.filter((sheet) => sheet.kind === 'week');
  readonly months = this.sheets.filter((sheet) => sheet.kind === 'month');
  readonly formatSheetPeriod = formatSheetPeriod;
  readonly formatSize = formatSize;

  ngOnInit() {
    this.seo.apply(
      this.settings,
      'Feuilles',
      `Feuilles de semaine et feuilles du mois de ${this.settings.shortName}, à télécharger.`,
      '/feuilles',
    );
  }

  fileUrl(sheet: ParishSheet): string {
    return `/api/sheets/${sheet.id}/fichier`;
  }
}
