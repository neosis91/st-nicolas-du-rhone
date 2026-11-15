import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ApiService } from '../core/api.service';
import { ParishEvent } from '../core/models';
import { ToastService } from '../core/toast';
import { AgendaCalendar } from './agenda-calendar';
import { bindRoutedForm } from './admin-dialog';
import { EventFormPage } from './event-form';

@Component({
  selector: 'app-events-admin',
  imports: [RouterLink, RouterOutlet, AgendaCalendar],
  templateUrl: './events.html',
})
export class EventsAdmin implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  readonly events = signal<ParishEvent[]>([]);

  constructor() {
    bindRoutedForm(EventFormPage, ['/admin/agenda'], (result) => {
      this.toast.show(result === 'deleted' ? 'Supprimé.' : 'Enregistré.');
      this.reload();
    });
  }

  ngOnInit() {
    this.reload();
  }

  openEvent(event: ParishEvent) {
    void this.router.navigate(['/admin/agenda', event.id]);
  }

  createOn(date: Date) {
    const at = new Date(date);
    if (at.getHours() === 0 && at.getMinutes() === 0) {
      at.setHours(10, 0, 0, 0);
    }
    void this.router.navigate(['/admin/agenda', 'nouveau'], {
      queryParams: { at: at.toISOString() },
    });
  }

  private reload() {
    this.api.adminEvents().subscribe((events) => this.events.set(events));
  }
}
