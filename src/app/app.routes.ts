import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guards';
import { roleGuard } from './core/guards/role.guards';

export const routes: Routes = [
  // ─── Public Routes ─────────────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./features/public/discover/discover').then((m) => m.Discover),
  },
  {
    path: 'discover',
    loadComponent: () =>
      import('./features/public/discover/discover').then((m) => m.Discover),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'movie-details',
    loadComponent: () =>
      import('./features/public/movie-details/movie-details').then(
        (m) => m.MovieDetailsComponent
      ),
  },
  {
    path: 'movie-details/:id',
    loadComponent: () =>
      import('./features/public/movie-details/movie-details').then(
        (m) => m.MovieDetailsComponent
      ),
  },

  // ─── Customer Routes (authenticated) ───────────────────────────────────────
  {
    path: 'my-tickets',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/portals/customer/my-tickets/my-tickets').then(
        (m) => m.MyTickets
      ),
  },
  {
    path: 'seat-selection/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/booking/seat-selection/seat-selection').then(
        (m) => m.SeatSelection
      ),
  },
  {
    path: 'booking/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/booking/booking-page/booking-page').then(
        (m) => m.BookingPage
      ),
  },
  {
    path: 'booking-success',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/booking/booking-success/booking-success').then(
        (m) => m.BookingSuccess
      ),
  },

  // ─── Organizer Routes (ORGANIZER | ADMIN role required) ────────────────────
  {
    path: 'organizer',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ORGANIZER', 'ADMIN'] },
    loadComponent: () =>
      import('./features/portals/organizer/dashboard/dashboard').then(
        (m) => m.Dashboard
      ),
  },
  {
    path: 'organizer/movies/new',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ORGANIZER', 'ADMIN'] },
    loadComponent: () =>
      import('./features/portals/organizer/event-editor/event-editor').then(
        (m) => m.EventEditor
      ),
  },
  {
    path: 'organizer/movies/:id/edit',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ORGANIZER', 'ADMIN'] },
    loadComponent: () =>
      import('./features/portals/organizer/event-editor/event-editor').then(
        (m) => m.EventEditor
      ),
  },
  {
    path: 'organizer/movies/:id/attendees',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ORGANIZER', 'ADMIN'] },
    loadComponent: () =>
      import('./features/portals/organizer/attendees/attendees').then(
        (m) => m.Attendees
      ),
  },

  // ─── Admin Routes (ADMIN role required) ────────────────────────────────────
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () =>
      import('./features/portals/admin/admin-dashboard/admin-dashboard').then(
        (m) => m.AdminDashboardComponent
      ),
  },

  // ─── Wildcard / 404 ────────────────────────────────────────────────────────
  {
    path: '**',
    loadComponent: () =>
      import('./features/public/not-found/not-found').then((m) => m.NotFound),
  },
];
