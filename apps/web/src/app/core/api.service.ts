import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, isDevMode, Service } from '@angular/core';
import { catchError, retry, throwError, timer } from 'rxjs';
import { API_ORIGIN } from './api-origin';
import {
  AccountUser,
  Article,
  ArticleRecord,
  ArticleSummary,
  MassSchedule,
  MassTime,
  Ministry,
  ParishEvent,
  ParishMessage,
  ParishSheet,
  Person,
  Place,
  Sacrament,
  Settings,
  SettingsInput,
  SheetKind,
  SheetMaterial,
  Summary,
} from './models';

@Service()
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly origin = inject(API_ORIGIN);

  settings() {
    return this.read<Settings>('/api/settings');
  }

  articles() {
    return this.read<ArticleSummary[]>('/api/articles');
  }

  article(slug: string) {
    return this.read<Article>(`/api/articles/${encodeURIComponent(slug)}`);
  }

  events() {
    return this.read<ParishEvent[]>('/api/events');
  }

  places() {
    return this.read<Place[]>('/api/places');
  }

  masses() {
    return this.read<MassSchedule>('/api/masses');
  }

  people() {
    return this.read<Person[]>('/api/people');
  }

  sacraments() {
    return this.read<Sacrament[]>('/api/sacraments');
  }

  ministries() {
    return this.read<Ministry[]>('/api/ministries');
  }

  sheets() {
    return this.read<ParishSheet[]>('/api/sheets');
  }

  sendMessage(body: { name: string; contact: string; subject: string; body: string; company: string }) {
    return this.http.post<{ ok: boolean }>(this.url('/api/messages'), body);
  }

  summary() {
    return this.http.get<Summary>(this.url('/api/admin/summary'));
  }

  saveSettings(body: SettingsInput) {
    return this.http.put<Settings>(this.url('/api/admin/settings'), body);
  }

  adminArticles() {
    return this.http.get<ArticleRecord[]>(this.url('/api/admin/articles'));
  }

  adminArticle(id: string) {
    return this.http.get<ArticleRecord>(this.url(`/api/admin/articles/${id}`));
  }

  createArticle(body: unknown) {
    return this.http.post<ArticleRecord>(this.url('/api/admin/articles'), body);
  }

  updateArticle(id: string, body: unknown) {
    return this.http.put<ArticleRecord>(this.url(`/api/admin/articles/${id}`), body);
  }

  deleteArticle(id: string) {
    return this.http.delete(this.url(`/api/admin/articles/${id}`));
  }

  adminEvents() {
    return this.http.get<ParishEvent[]>(this.url('/api/admin/events'));
  }

  adminEvent(id: string) {
    return this.http.get<ParishEvent>(this.url(`/api/admin/events/${id}`));
  }

  createEvent(body: unknown) {
    return this.http.post<ParishEvent>(this.url('/api/admin/events'), body);
  }

  updateEvent(id: string, body: unknown) {
    return this.http.put<ParishEvent>(this.url(`/api/admin/events/${id}`), body);
  }

  deleteEvent(id: string) {
    return this.http.delete(this.url(`/api/admin/events/${id}`));
  }

  adminPlaces() {
    return this.http.get<Place[]>(this.url('/api/admin/places'));
  }

  savePlace(body: unknown, id?: string) {
    return id
      ? this.http.put<Place>(this.url(`/api/admin/places/${id}`), body)
      : this.http.post<Place>(this.url('/api/admin/places'), body);
  }

  deletePlace(id: string) {
    return this.http.delete(this.url(`/api/admin/places/${id}`));
  }

  adminPeople() {
    return this.http.get<Person[]>(this.url('/api/admin/people'));
  }

  savePerson(body: unknown, id?: string) {
    return id
      ? this.http.put<Person>(this.url(`/api/admin/people/${id}`), body)
      : this.http.post<Person>(this.url('/api/admin/people'), body);
  }

  deletePerson(id: string) {
    return this.http.delete(this.url(`/api/admin/people/${id}`));
  }

  adminMasses() {
    return this.http.get<MassTime[]>(this.url('/api/admin/masses'));
  }

  saveMass(body: unknown, id?: string) {
    return id
      ? this.http.put<MassTime>(this.url(`/api/admin/masses/${id}`), body)
      : this.http.post<MassTime>(this.url('/api/admin/masses'), body);
  }

  deleteMass(id: string) {
    return this.http.delete(this.url(`/api/admin/masses/${id}`));
  }

  adminSacraments() {
    return this.http.get<Sacrament[]>(this.url('/api/admin/sacraments'));
  }

  adminSacrament(id: string) {
    return this.http.get<Sacrament>(this.url(`/api/admin/sacraments/${id}`));
  }

  saveSacrament(body: unknown, id?: string) {
    return id
      ? this.http.put<Sacrament>(this.url(`/api/admin/sacraments/${id}`), body)
      : this.http.post<Sacrament>(this.url('/api/admin/sacraments'), body);
  }

  deleteSacrament(id: string) {
    return this.http.delete(this.url(`/api/admin/sacraments/${id}`));
  }

  adminMinistries() {
    return this.http.get<Ministry[]>(this.url('/api/admin/ministries'));
  }

  adminMinistry(id: string) {
    return this.http.get<Ministry>(this.url(`/api/admin/ministries/${id}`));
  }

  saveMinistry(body: unknown, id?: string) {
    return id
      ? this.http.put<Ministry>(this.url(`/api/admin/ministries/${id}`), body)
      : this.http.post<Ministry>(this.url('/api/admin/ministries'), body);
  }

  deleteMinistry(id: string) {
    return this.http.delete(this.url(`/api/admin/ministries/${id}`));
  }

  messages() {
    return this.http.get<ParishMessage[]>(this.url('/api/admin/messages'));
  }

  markMessageRead(id: string) {
    return this.http.put<ParishMessage>(this.url(`/api/admin/messages/${id}/read`), {});
  }

  deleteMessage(id: string) {
    return this.http.delete(this.url(`/api/admin/messages/${id}`));
  }

  adminUsers() {
    return this.http.get<AccountUser[]>(this.url('/api/admin/users'));
  }

  saveUser(body: { firstName: string; lastName: string; email: string; password?: string }, id?: string) {
    return id
      ? this.http.put<AccountUser>(this.url(`/api/admin/users/${id}`), body)
      : this.http.post<AccountUser>(this.url('/api/admin/users'), body);
  }

  deleteUser(id: string) {
    return this.http.delete(this.url(`/api/admin/users/${id}`));
  }

  adminSheets() {
    return this.http.get<ParishSheet[]>(this.url('/api/admin/sheets'));
  }

  sheetMaterial(kind: SheetKind, periodStart: string) {
    const params = new URLSearchParams({ kind, periodStart });
    return this.http.get<SheetMaterial>(this.url(`/api/admin/sheets/matiere?${params}`));
  }

  uploadSheet(body: { kind: SheetKind; title: string; periodStart: string; published: boolean; file: File }) {
    const data = new FormData();
    data.set('kind', body.kind);
    data.set('title', body.title);
    data.set('periodStart', body.periodStart);
    data.set('published', String(body.published));
    data.set('file', body.file, body.file.name);
    return this.http.post<ParishSheet>(this.url('/api/admin/sheets'), data);
  }

  downloadAdminSheet(id: string) {
    return this.http.get(this.url(`/api/admin/sheets/${id}/fichier`), { responseType: 'blob' });
  }

  deleteSheet(id: string) {
    return this.http.delete(this.url(`/api/admin/sheets/${id}`));
  }

  private read<T>(path: string) {
    return this.http.get<T>(this.url(path)).pipe(
      retry({
        count: isDevMode() ? 12 : 1,
        delay: (error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status > 0 && error.status < 500) {
            return throwError(() => error);
          }
          return timer(500);
        },
      }),
      catchError((error: unknown) => throwError(() => error)),
    );
  }

  private url(path: string): string {
    return `${this.origin}${path}`;
  }
}
