import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { UserRole } from '../models/user.model';
import { AuthService } from '../services/auth.service';

/**
 * Functional route guard that enforces role-based access control.
 *
 * Usage in routes:
 * ```ts
 * {
 *   path: 'organizer',
 *   canActivate: [authGuard, roleGuard],
 *   data: { roles: ['ORGANIZER', 'ADMIN'] },
 *   ...
 * }
 * ```
 *
 * Decodes the JWT payload client-side (no library needed).
 * Redirects to /login if no token, or to / (home) if role is insufficient.
 */
export const roleGuard: CanActivateFn = (route, _state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const role = authService.getRoleFromToken();
  if (!role) {
    return router.createUrlTree(['/login']);
  }

  const requiredRoles: UserRole[] = route.data?.['roles'] ?? [];

  if (requiredRoles.length === 0 || requiredRoles.includes(role)) {
    return true;
  }

  // Authenticated but insufficient role — redirect to home
  return router.createUrlTree(['/']);
};
