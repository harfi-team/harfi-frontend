import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';

export function roleGuard(allowed: string[]): CanActivateFn {
  return () => {
    const tokenService = inject(TokenService);
    const router = inject(Router);
    const user = tokenService.getUser();

    if (user && allowed.includes(user.role)) {
      return true;
    }

    router.navigate(['/']);
    return false;
  };
}
