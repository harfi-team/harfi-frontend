// import { Routes } from '@angular/router';
// import { authGuard } from '../../core/guards/auth.guard';

// export const userRoutes: Routes = [
//   {
//     path: '', // عند الدخول على /user مباشرة سيعرض البروفايل
//     canActivate: [authGuard],
//     loadComponent: () =>
//       import('./profile/user-profile.component').then((m) => m.UserProfileComponent),
//   },
// ];
import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { TokenService } from '../../core/services/token.service';

// Guard: لو craftsman يروح على بروفايله في صفحة الحرفيين
const craftsmanProfileRedirectGuard = () => {
  const tokenSvc = inject(TokenService);
  const router = inject(Router);
  const user = tokenSvc.getUser();

  if (user?.role === 'craftsman' && user?.craftsmanId) {
    return router.createUrlTree(['/craftsmen/profile', user.craftsmanId]);
  }
  return true;
};

export const userRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard, craftsmanProfileRedirectGuard],
    loadComponent: () =>
      import('./profile/user-profile.component').then((m) => m.UserProfileComponent),
  },
];