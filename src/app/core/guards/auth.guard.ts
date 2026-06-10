import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map, of, switchMap } from 'rxjs';
import { TokenService } from '../services/token.service';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!tokenService.isLoggedIn()) {
    router.navigate(['/auth/login']);
    return of(false);
  }

  return authService.loadCurrentUser().pipe(
    map(user => {
      if (!user) {
        tokenService.clearAll();
        router.navigate(['/auth/login']);
        return false;
      }
      return true;
    }),
  );
};
