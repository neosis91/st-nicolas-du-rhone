import { Routes } from '@angular/router';
import { adminGuard } from './core/admin.guard';
import {
  articlesResolver,
  articleResolver,
  celebrerResolver,
  eventsResolver,
  homeResolver,
  ministriesResolver,
  peopleResolver,
  placesResolver,
  sacramentsResolver,
  settingsResolver,
  sheetsResolver,
} from './core/resolvers';

export const routes: Routes = [
  {
    path: 'admin/connexion',
    loadComponent: () => import('./admin/login').then((module) => module.LoginPage),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/admin-shell').then((module) => module.AdminShell),
    children: [
      { path: '', loadComponent: () => import('./admin/dashboard').then((module) => module.DashboardPage) },
      {
        path: 'actualites',
        loadComponent: () => import('./admin/articles').then((module) => module.ArticlesAdmin),
        children: [{ path: ':id', loadComponent: () => import('./admin/route-marker').then((module) => module.RouteMarker) }],
      },
      {
        path: 'agenda',
        loadComponent: () => import('./admin/events').then((module) => module.EventsAdmin),
        children: [{ path: ':id', loadComponent: () => import('./admin/route-marker').then((module) => module.RouteMarker) }],
      },
      { path: 'messes', loadComponent: () => import('./admin/masses').then((module) => module.MassesAdmin) },
      { path: 'feuilles', loadComponent: () => import('./admin/sheets').then((module) => module.SheetsAdmin) },
      { path: 'lieux', loadComponent: () => import('./admin/places').then((module) => module.PlacesAdmin) },
      { path: 'equipe', loadComponent: () => import('./admin/people').then((module) => module.PeopleAdmin) },
      {
        path: 'sacrements',
        loadComponent: () => import('./admin/sacraments').then((module) => module.SacramentsAdmin),
        children: [{ path: ':id', loadComponent: () => import('./admin/route-marker').then((module) => module.RouteMarker) }],
      },
      {
        path: 'services',
        loadComponent: () => import('./admin/ministries').then((module) => module.MinistriesAdmin),
        children: [{ path: ':id', loadComponent: () => import('./admin/route-marker').then((module) => module.RouteMarker) }],
      },
      { path: 'messages', loadComponent: () => import('./admin/messages').then((module) => module.MessagesAdmin) },
      { path: 'parametres', loadComponent: () => import('./admin/settings-form').then((module) => module.SettingsFormPage) },
      { path: 'utilisateurs', loadComponent: () => import('./admin/users').then((module) => module.UsersAdmin) },
      { path: 'utilisateurs/:id', loadComponent: () => import('./admin/profile').then((module) => module.ProfilePage) },
      { path: 'profil', loadComponent: () => import('./admin/profile').then((module) => module.ProfilePage) },
    ],
  },
  {
    path: '',
    loadComponent: () => import('./layout/public-shell').then((module) => module.PublicShell),
    resolve: { settings: settingsResolver },
    children: [
      { path: '', loadComponent: () => import('./pages/home').then((module) => module.HomePage), resolve: { home: homeResolver } },
      { path: 'paroisse', loadComponent: () => import('./pages/paroisse').then((module) => module.ParoissePage), resolve: { places: placesResolver } },
      { path: 'paroisse/equipe', loadComponent: () => import('./pages/equipe').then((module) => module.EquipePage), resolve: { people: peopleResolver } },
      { path: 'celebrer', loadComponent: () => import('./pages/celebrer').then((module) => module.CelebrerPage), resolve: { celebrer: celebrerResolver } },
      { path: 'feuilles', loadComponent: () => import('./pages/feuilles').then((module) => module.FeuillesPage), resolve: { sheets: sheetsResolver } },
      { path: 'celebrer/sacrements', loadComponent: () => import('./pages/sacrements').then((module) => module.SacrementsPage), resolve: { sacraments: sacramentsResolver, people: peopleResolver } },
      { path: 'vivre', loadComponent: () => import('./pages/vivre').then((module) => module.VivrePage), resolve: { ministries: ministriesResolver } },
      { path: 'agenda', loadComponent: () => import('./pages/agenda').then((module) => module.AgendaPage), resolve: { events: eventsResolver } },
      { path: 'actualites', loadComponent: () => import('./pages/actualites').then((module) => module.ActualitesPage), resolve: { articles: articlesResolver } },
      { path: 'actualites/:slug', loadComponent: () => import('./pages/article').then((module) => module.ArticlePage), resolve: { article: articleResolver } },
      { path: 'contact', loadComponent: () => import('./pages/contact').then((module) => module.ContactPage), resolve: { people: peopleResolver } },
      { path: 'don', loadComponent: () => import('./pages/don').then((module) => module.DonPage) },
      { path: 'mentions-legales', loadComponent: () => import('./pages/mentions').then((module) => module.MentionsPage) },
      { path: '**', loadComponent: () => import('./pages/not-found').then((module) => module.NotFoundPage) },
    ],
  },
];
