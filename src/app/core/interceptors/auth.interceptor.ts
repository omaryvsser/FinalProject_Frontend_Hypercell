import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Functional HTTP Interceptor attaching JWT Bearer tokens to protected outgoing API requests
 * and handling 401/403 session expiration.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Skip attaching authorization header for public catalog endpoints
  const isPublicEndpoint = req.url.includes('/public/');

  // Clone request and attach Authorization header if token exists
  const authReq = (token && !isPublicEndpoint)
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthApi = req.url.includes('/v1/auth/');

      // Redirect to login upon session expiration or unauthorized response
      if (!isAuthApi && (error.status === 401 || error.status === 403)) {
        authService.logout();
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
