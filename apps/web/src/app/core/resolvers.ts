import { inject } from '@angular/core';
import { ActivatedRoute, ResolveFn } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from './api.service';
import { Article, ArticleSummary, MassSchedule, Ministry, ParishEvent, ParishSheet, Person, Place, Sacrament, Settings } from './models';

export function parentData<T>(route: ActivatedRoute, key: string): T {
  let current: ActivatedRoute | null = route;
  while (current) {
    const value = current.snapshot.data[key] as T | undefined;
    if (value) return value;
    current = current.parent;
  }
  throw new Error(`Donnée de page manquante : ${key}`);
}

export interface HomeData {
  articles: ArticleSummary[];
  events: ParishEvent[];
  places: Place[];
  masses: MassSchedule;
}

export const settingsResolver: ResolveFn<Settings> = () => inject(ApiService).settings();

export const homeResolver: ResolveFn<HomeData> = () => {
  const api = inject(ApiService);
  return forkJoin({
    articles: api.articles(),
    events: api.events(),
    places: api.places(),
    masses: api.masses(),
  });
};

export const placesResolver: ResolveFn<Place[]> = () => inject(ApiService).places();
export const peopleResolver: ResolveFn<Person[]> = () => inject(ApiService).people();
export const massesResolver: ResolveFn<MassSchedule> = () => inject(ApiService).masses();
export const sacramentsResolver: ResolveFn<Sacrament[]> = () => inject(ApiService).sacraments();
export const ministriesResolver: ResolveFn<Ministry[]> = () => inject(ApiService).ministries();
export const sheetsResolver: ResolveFn<ParishSheet[]> = () => inject(ApiService).sheets();
export const eventsResolver: ResolveFn<ParishEvent[]> = () => inject(ApiService).events();
export const articlesResolver: ResolveFn<ArticleSummary[]> = () => inject(ApiService).articles();

export const celebrerResolver: ResolveFn<{ masses: MassSchedule; places: Place[] }> = () => {
  const api = inject(ApiService);
  return forkJoin({ masses: api.masses(), places: api.places() });
};

export const articleResolver: ResolveFn<Article | null> = (route) => {
  const slug = route.paramMap.get('slug') ?? '';
  return inject(ApiService)
    .article(slug)
    .pipe(catchError(() => of(null)));
};
