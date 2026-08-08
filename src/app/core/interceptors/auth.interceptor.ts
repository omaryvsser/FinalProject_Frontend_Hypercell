import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const token = authService.getToken();

  // 1. Skip attaching token for public API endpoints (e.g. public Discover page catalog)
  const isPublicEndpoint = req.url.includes('/public/');

  // 2. Clone request and attach Bearer token if present and not a public endpoint
  const authReq = (token && !isPublicEndpoint)
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 3. Check if the failed request was an authentication API call
      const isAuthApi = req.url.includes('/v1/auth/');

      // 4. Handle expired/unauthorized sessions for protected resources
      if (!isAuthApi && (error.status === 401 || error.status === 403)) {
        authService.logout(); // Updates tokenSignal & clears localStorage
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
