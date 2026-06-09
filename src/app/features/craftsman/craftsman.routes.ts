import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

// Owner: Hadeer — Phase 2: Discovery Engine
export const craftsmanRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./search/craftsman-search.component').then(m => m.CraftsmanSearchComponent),
    canActivate: [authGuard],
  },
  {
    path: ':id',
    loadComponent: () => import('./profile/craftsman-profile.component').then(m => m.CraftsmanProfileComponent),
    canActivate: [authGuard],
  },
];
