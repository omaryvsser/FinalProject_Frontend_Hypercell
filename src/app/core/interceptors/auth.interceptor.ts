import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const token = authService.getToken();

  // 1. Clone request and attach Bearer token if present
  const authReq = token
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 2. Check if the failed request was a login/register attempt
      const isAuthApi = req.url.includes('/v1/auth/');

      // 3. Only handle expired/unauthorized sessions for protected resources
      if (!isAuthApi && (error.status === 401 || error.status === 403)) {
        authService.logout(); // Updates tokenSignal & clears localStorage
        router.navigate(['/auth/login']);
      }

      return throwError(() => error);
    })
  );
};
