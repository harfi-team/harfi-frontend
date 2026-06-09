import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { ErrorHandlerService } from '../services/error-handler.service';
import { AuthResponseDto } from '../models/auth.models';

let isRefreshing = false;
let refreshSubject = new BehaviorSubject<string | null>(null);

function skipRefresh(url: string): boolean {
  return url.includes('/auth/refresh') ||
    url.includes('/auth/login') ||
    url.includes('/auth/send-phone-code') ||
    url.includes('/auth/verify-phone') ||
    url.includes('/auth/resend-phone-code') ||
    url.includes('/auth/register');
}

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  if (skipRefresh(req.url)) {
    return next(req);
  }

  const authService = inject(AuthService);
  const tokenService = inject(TokenService);
  const errorHandler = inject(ErrorHandlerService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 429) {
        const msg = 'لقد تجاوزت الحد المسموح من الطلبات. حاول مرة أخرى بعد دقيقة.';
        errorHandler.error(msg);
        return throwError(() => error);
      }

      if (error.status === 403) {
        if (isRefreshing) {
          return refreshSubject.pipe(
            filter(token => token !== null),
            take(1),
            switchMap(token => {
              const cloned = req.clone({
                setHeaders: { Authorization: `Bearer ${token}` },
              });
              return next(cloned);
            })
          );
        }

        isRefreshing = true;
        refreshSubject.next(null);

        return authService.refreshToken().pipe(
          switchMap((response: AuthResponseDto) => {
            isRefreshing = false;
            refreshSubject.next(response.accessToken);
            const cloned = req.clone({
              setHeaders: { Authorization: `Bearer ${response.accessToken}` },
            });
            return next(cloned);
          }),
          catchError(refreshError => {
            isRefreshing = false;
            refreshSubject.error(refreshError);
            refreshSubject = new BehaviorSubject<string | null>(null);
            tokenService.clearAll();
            router.navigate(['/auth/login']);
            return throwError(() => refreshError);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
