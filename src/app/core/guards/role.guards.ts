import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service'; // Pointing to core/services

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Reads the roles from route data: data: { roles: ['ORGANIZER', 'ADMIN'] }
  const allowedRoles = (route.data?.['roles'] as UserRole[]) || [];
  const currentUser = authService.currentUser();
  const userRole = currentUser?.role;

  if (userRole && allowedRoles.includes(userRole)) {
    return true;
  }

  // Redirect unauthorized users to discover page
  return router.createUrlTree(['/discover']);
};
