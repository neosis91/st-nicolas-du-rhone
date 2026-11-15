import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { formatDate } from '../core/format';
import { Summary } from '../core/models';

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
})
export class DashboardPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly summary = signal<Summary | null>(null);
  readonly formatDate = formatDate;

  ngOnInit() {
    this.api.summary().subscribe((summary) => this.summary.set(summary));
  }
}
