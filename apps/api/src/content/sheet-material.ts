export type SheetKind = 'week' | 'month';

export interface SheetPeriod {
  start: Date;
  end: Date;
}

export function sheetPeriod(kind: SheetKind, periodStart: string): SheetPeriod {
  const start = new Date(`${periodStart}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) {
    throw new Error('Date invalide.');
  }
  if (kind === 'month') {
    start.setUTCDate(1);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1, 1);
    return { start, end };
  }
  const day = start.getUTCDay();
  start.setUTCDate(start.getUTCDate() + (day === 0 ? -6 : 1 - day));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  return { start, end };
}

export interface SheetMass {
  dayLabel: string;
  time: string;
  location: string;
  note: string;
  period: string;
}

export interface SheetMinistry {
  title: string;
  body: string;
}

export interface SheetEvent {
  title: string;
  detail: string;
  location: string;
  kind: string;
  startsAt: Date;
}

export interface SheetArticle {
  title: string;
  excerpt: string;
  category: string;
  publishedAt: Date;
}

export interface SheetMaterial {
  kind: SheetKind;
  periodStart: string;
  periodEnd: string;
  masses: SheetMass[];
  ministries: SheetMinistry[];
  events: Array<Omit<SheetEvent, 'startsAt'> & { startsAt: string }>;
  articles: Array<Omit<SheetArticle, 'publishedAt'> & { publishedAt: string }>;
}

export function composeSheetMaterial(
  kind: SheetKind,
  period: SheetPeriod,
  sources: {
    masses: SheetMass[];
    ministries: SheetMinistry[];
    events: SheetEvent[];
    articles: SheetArticle[];
  },
): SheetMaterial {
  return {
    kind,
    periodStart: period.start.toISOString(),
    periodEnd: period.end.toISOString(),
    masses: sources.masses,
    ministries: sources.ministries,
    events: sources.events.map((event) => ({ ...event, startsAt: event.startsAt.toISOString() })),
    articles: sources.articles.map((article) => ({
      ...article,
      publishedAt: article.publishedAt.toISOString(),
    })),
  };
}
