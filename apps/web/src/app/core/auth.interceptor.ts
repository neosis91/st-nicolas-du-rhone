import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();
  const mfaAccount = /\/api\/auth\/mfa\/(preparer|activer|desactiver)/.test(request.url);
  const passkeyAccount = /\/api\/auth\/passkey(?!\/(options|verifier))/.test(request.url);
  const secured =
    request.url.includes('/api/admin') ||
    request.url.includes('/api/auth/password') ||
    request.url.includes('/api/auth/me') ||
    mfaAccount ||
    passkeyAccount;
  const outgoing =
    token && secured
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;

  return next(outgoing).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        (request.url.includes('/api/admin') ||
          request.url.includes('/api/auth/me') ||
          request.url.includes('/api/auth/password') ||
          mfaAccount ||
          passkeyAccount)
      ) {
        auth.clear();
        if (!request.url.includes('/api/auth/me')) {
          void router.navigateByUrl('/admin/connexion');
        }
      }
      return throwError(() => error);
    }),
  );
};
