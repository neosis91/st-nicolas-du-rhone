export interface AccountUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  createdAt: string;
}

export interface Settings {
  name: string;
  shortName: string;
  domain: string;
  siteUrl: string;
  diocese: string;
  dioceseUrl: string;
  parishOnDioceseUrl: string;
  donationsUrl: string;
  bequestsUrl: string;
  readingsUrl: string;
  sector: string;
  bishop: string;
  email: string;
  phone: string;
  phoneHref: string | null;
  street: string;
  postalCode: string;
  city: string;
  hours: string;
  mapUrl: string;
  presbyteryStreet: string;
  heroLede: string;
  aboutText: string;
  teamIntro: string;
  teamCouncils: string;
  massIntro: string;
  sacramentIntro: string;
  lifeIntro: string;
  donateIntro: string;
  welcomeDetail: string;
  publicationDirector: string;
  hostNote: string;
  denierEmail: string;
}

export interface ArticleSummary {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
}

export interface Article extends ArticleSummary {
  paragraphs: string[];
  sourceLabel: string | null;
  sourceUrl: string | null;
}

export interface ArticleRecord extends ArticleSummary {
  id: string;
  body: string;
  sourceLabel: string | null;
  sourceUrl: string | null;
  published: boolean;
}

export interface ParishEvent {
  id: string;
  title: string;
  detail: string;
  location: string;
  kind: string;
  startsAt: string;
  published: boolean;
}

export interface Place {
  id: string;
  town: string;
  kind: 'fleuve' | 'coteaux' | string;
  church: string | null;
  address: string | null;
  note: string;
  sortOrder: number;
}

export interface Person {
  id: string;
  name: string;
  role: string;
  detail: string;
  phone: string | null;
  phoneHref: string | null;
  email: string | null;
  groupName: 'ministre' | 'curie' | string;
  showOnContact: boolean;
  sortOrder: number;
}

export interface MassTime {
  id: string;
  dayLabel: string;
  time: string;
  location: string;
  note: string;
  period: 'sunday' | 'weekday' | string;
  sortOrder: number;
}

export interface MassSchedule {
  sunday: MassTime[];
  weekday: MassTime[];
}

export interface Sacrament {
  id?: string;
  slug: string;
  title: string;
  text: string;
  steps: string[];
  sortOrder?: number;
}

export interface Ministry {
  id?: string;
  slug: string;
  title: string;
  paragraphs?: string[];
  body?: string;
  linkLabel: string | null;
  linkUrl: string | null;
  sortOrder?: number;
}

export interface ParishMessage {
  id: string;
  name: string;
  contact: string;
  subject: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface Summary {
  articles: number;
  events: number;
  unreadMessages: number;
  sheets: number;
  latestMessages: ParishMessage[];
}

export type SheetKind = 'week' | 'month';

export interface ParishSheet {
  id: string;
  kind: SheetKind;
  title: string;
  periodStart: string;
  originalName: string;
  size: number;
  source: 'upload' | 'generated' | string;
  published?: boolean;
}

export interface SheetMaterial {
  kind: SheetKind;
  periodStart: string;
  periodEnd: string;
  masses: unknown[];
  ministries: unknown[];
  events: unknown[];
  articles: unknown[];
}

export type SettingsInput = Omit<Settings, 'phoneHref'>;
