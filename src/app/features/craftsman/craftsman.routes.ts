import { Routes } from '@angular/router';

// Owner: Hadeer — Phase 2: Discovery Engine
export const craftsmanRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./craftsman-reviews/craftsman-reviews/craftsman-reviews').then(
        (m) => m.CraftsmanReviewsComponent,
      ),
  },
];
