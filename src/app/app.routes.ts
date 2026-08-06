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
    path: 'booking',
    loadComponent: () => import('./features/booking/booking-page/booking-page').then((m) => m.BookingPage),
  },
  {
    path: 'booking-success',
    loadComponent: () => import('./features/booking/booking-success/booking-success').then((m) => m.BookingSuccess),
  },
  {
  path: 'seat-selection/:id',
  loadComponent: () =>
    import('./features/booking/seat-selection/seat-selection')
      .then((m) => m.SeatSelection),
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full' //to check that all the  url is matched and not just the prefix
  },
];
