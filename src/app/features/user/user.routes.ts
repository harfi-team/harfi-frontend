import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const userRoutes: Routes = [
  {
    path: 'profile/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./profile/user-profile.component').then(m => m.UserProfileComponent)
  }
];