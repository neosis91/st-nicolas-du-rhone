import { Component, computed, input, linkedSignal, output, signal } from '@angular/core';
import { ParishEvent } from '../core/models';

export type AgendaView = 'month' | 'week' | 'agenda';

type DayCell = {
  key: string;
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  events: ParishEvent[];
};

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const KIND_CLASS: Record<string, string> = {
  Liturgie: 'bg-navy text-white',
  Accueil: 'bg-river text-white',
  Paroisse: 'bg-gold text-white',
};
const WEEK_HOUR_START = 6;
const WEEK_HOUR_END = 22;
const WEEK_HOUR_PX = 52;
const WEEK_EVENT_MINUTES = 60;

@Component({
  selector: 'app-agenda-calendar',
  templateUrl: './agenda-calendar.html',
})
export class AgendaCalendar {
  readonly events = input.required<ParishEvent[]>();
  readonly selectEvent = output<ParishEvent>();
  readonly createOn = output<Date>();

  readonly view = signal<AgendaView>('month');
  readonly cursor = signal(startOfDay(new Date()));
  readonly selected = linkedSignal(() => this.cursor());

  readonly weekdays = WEEKDAYS;
  readonly weekHours = Array.from(
    { length: WEEK_HOUR_END - WEEK_HOUR_START },
    (_, index) => WEEK_HOUR_START + index,
  );
  readonly weekHourPx = WEEK_HOUR_PX;
  readonly weekGridHeight = (WEEK_HOUR_END - WEEK_HOUR_START) * WEEK_HOUR_PX;
  readonly weekGridCols = `3.25rem repeat(7, minmax(4.75rem, 1fr))`;

  readonly title = computed(() => formatMonthYear(this.cursor()));
  readonly weekTitle = computed(() => formatWeekRange(startOfWeek(this.cursor())));

  readonly monthDays = computed(() => buildMonth(this.cursor(), this.events()));
  readonly weekDays = computed(() => buildWeek(this.cursor(), this.events()));
  readonly agendaDays = computed(() => buildAgenda(this.cursor(), this.events(), 42));
  readonly selectedDay = computed(() => {
    const key = dayKey(this.selected());
    return this.monthDays().find((day) => day.key === key) ?? {
      key,
      date: this.selected(),
      inMonth: true,
      isToday: isSameDay(this.selected(), new Date()),
      events: eventsOnDay(this.events(), this.selected()),
    };
  });
  readonly nowLine = computed(() => {
    const now = new Date();
    const today = this.weekDays().find((day) => day.isToday);
    if (!today) return null;
    const minutes = parisMinutes(now.toISOString());
    const start = WEEK_HOUR_START * 60;
    const end = WEEK_HOUR_END * 60;
    if (minutes < start || minutes > end) return null;
    return {
      dayKey: today.key,
      top: ((minutes - start) / 60) * WEEK_HOUR_PX,
    };
  });

  kindClass(kind: string) {
    return KIND_CLASS[kind] ?? 'bg-navy-2 text-white';
  }

  timeOf(iso: string) {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris',
    }).format(new Date(iso));
  }

  hourLabel(hour: number) {
    return `${String(hour).padStart(2, '0')}:00`;
  }

  dayLabel(date: Date) {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'Europe/Paris',
    }).format(date);
  }

  eventTop(iso: string) {
    const minutes = Math.max(WEEK_HOUR_START * 60, Math.min(WEEK_HOUR_END * 60, parisMinutes(iso)));
    return ((minutes - WEEK_HOUR_START * 60) / 60) * WEEK_HOUR_PX;
  }

  eventHeight() {
    return (WEEK_EVENT_MINUTES / 60) * WEEK_HOUR_PX;
  }

  setView(view: AgendaView) {
    this.view.set(view);
  }

  today() {
    const now = startOfDay(new Date());
    this.cursor.set(now);
    this.selected.set(now);
  }

  previous() {
    const current = this.cursor();
    if (this.view() === 'month') this.cursor.set(addMonths(current, -1));
    else if (this.view() === 'week') this.cursor.set(addDays(current, -7));
    else this.cursor.set(addDays(current, -14));
  }

  next() {
    const current = this.cursor();
    if (this.view() === 'month') this.cursor.set(addMonths(current, 1));
    else if (this.view() === 'week') this.cursor.set(addDays(current, 7));
    else this.cursor.set(addDays(current, 14));
  }

  pickDay(day: DayCell) {
    this.selected.set(day.date);
    if (!day.inMonth) this.cursor.set(day.date);
  }

  openDay(day: DayCell) {
    this.pickDay(day);
    this.createOn.emit(day.date);
  }

  openAtPointer(day: DayCell, click: MouseEvent) {
    const target = click.currentTarget as HTMLElement;
    const y = click.clientY - target.getBoundingClientRect().top;
    const totalMinutes = WEEK_HOUR_START * 60 + Math.round((y / WEEK_HOUR_PX) * 60 / 15) * 15;
    const clamped = Math.max(WEEK_HOUR_START * 60, Math.min((WEEK_HOUR_END - 1) * 60, totalMinutes));
    const at = new Date(day.date);
    at.setHours(Math.floor(clamped / 60), clamped % 60, 0, 0);
    this.pickDay(day);
    this.createOn.emit(at);
  }

  openEvent(event: ParishEvent, click: Event) {
    click.stopPropagation();
    this.selectEvent.emit(event);
  }
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const day = startOfDay(date);
  const weekday = (day.getDay() + 6) % 7;
  return addDays(day, -weekday);
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function dayKey(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function isSameDay(a: Date, b: Date) {
  return dayKey(a) === dayKey(b);
}

function eventsOnDay(events: ParishEvent[], date: Date) {
  const key = dayKey(date);
  return events
    .filter((event) => dayKey(new Date(event.startsAt)) === key)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
}

function buildMonth(cursor: Date, events: ParishEvent[]): DayCell[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = startOfWeek(first);
  const today = new Date();
  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(start, index);
    return {
      key: dayKey(date),
      date,
      inMonth: date.getMonth() === cursor.getMonth(),
      isToday: isSameDay(date, today),
      events: eventsOnDay(events, date),
    };
  });
}

function buildWeek(cursor: Date, events: ParishEvent[]): DayCell[] {
  const start = startOfWeek(cursor);
  const today = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(start, index);
    return {
      key: dayKey(date),
      date,
      inMonth: true,
      isToday: isSameDay(date, today),
      events: eventsOnDay(events, date),
    };
  });
}

function buildAgenda(cursor: Date, events: ParishEvent[], days: number): DayCell[] {
  const start = startOfDay(cursor);
  const today = new Date();
  const cells = Array.from({ length: days }, (_, index) => {
    const date = addDays(start, index);
    return {
      key: dayKey(date),
      date,
      inMonth: true,
      isToday: isSameDay(date, today),
      events: eventsOnDay(events, date),
    };
  });
  const withEvents = cells.filter((day) => day.events.length > 0);
  return withEvents.length ? withEvents : cells.slice(0, 7);
}

function formatMonthYear(date: Date) {
  const label = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date);
  return label.charAt(0).toLocaleUpperCase('fr-FR') + label.slice(1);
}

function formatWeekRange(start: Date) {
  const end = addDays(start, 6);
  const sameMonth = start.getMonth() === end.getMonth();
  const left = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: sameMonth ? undefined : 'short' }).format(start);
  const right = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(end);
  return `${left} – ${right}`;
}

function parisMinutes(iso: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
  return hour * 60 + minute;
}
