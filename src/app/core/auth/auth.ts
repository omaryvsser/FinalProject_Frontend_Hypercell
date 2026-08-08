import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Functional route guard that blocks unauthenticated access.
 * Checks for the presence of a JWT in localStorage.
 * Redirects unauthenticated users to /login.
 */
export const authGuard: CanActivateFn = (_route, _state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (authService.isLoggedIn()) {
    return true;
  }

  // Redirect to login, preserving the intended URL for post-login redirect
  return router.createUrlTree(['/login']);
};
