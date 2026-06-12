import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const craftsmanRoutes: Routes = [
  {
    path: 'register',
    loadComponent: () =>
      import('./register/craftsman-register.component').then((m) => m.CraftsmanRegisterComponent),
  },
  
  {
    path: ':id',
    loadComponent: () =>
      import('./profile/craftsman-profile.component').then((m) => m.CraftsmanProfileComponent),
    canActivate: [authGuard],
  },
];