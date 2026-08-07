import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/public/discover/discover').then((m) => m.Discover),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),},
  {
    path: 'my-tickets',
    loadComponent: () => import('./features/portals/customer/my-tickets/my-tickets').then((m) => m.MyTickets),
  },
  {
    path: 'seat-selection/:id',
    loadComponent: () =>
      import('./features/booking/seat-selection/seat-selection')
        .then((m) => m.SeatSelection),
  },
  {
    path: 'booking/:id',
    loadComponent: () =>
      import('./features/booking/booking-page/booking-page')
        .then((m) => m.BookingPage),
  },
  {
    path: 'booking-success',
    loadComponent: () =>
      import('./features/booking/booking-success/booking-success')
        .then((m) => m.BookingSuccess),
  },
  {
    path: 'movie-details',
    loadComponent: () =>
      import('./features/public/movie-details/movie-details')
        .then((m) => m.MovieDetailsComponent),
  },
  {
    path: 'movie-details/:id',
    loadComponent: () =>
      import('./features/public/movie-details/movie-details')
        .then((m) => m.MovieDetailsComponent),
  },
  {
  path: 'organizer',
  loadComponent: () =>
    import('./features/portals/organizer/dashboard/dashboard')
      .then((m) => m.Dashboard),
  },
  {
  path: 'organizer/movies/new',
  loadComponent: () =>
    import('./features/portals/organizer/event-editor/event-editor')
      .then((m) => m.EventEditor),
  },
  {
  path: 'organizer/movies/:id/edit',
  loadComponent: () =>
    import('./features/portals/organizer/event-editor/event-editor')
      .then((m) => m.EventEditor),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/portals/admin/admin-dashboard/admin-dashboard').then(
        (m) => m.AdminDashboardComponent
      ),
  },
  {
    path: 'organizer/movies/:id/attendees',
  loadComponent: () =>
    import('./features/portals/organizer/attendees/attendees')
      .then((m) => m.Attendees),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/public/not-found/not-found').then((m) => m.NotFound), // for any wrong url 
  },
];
