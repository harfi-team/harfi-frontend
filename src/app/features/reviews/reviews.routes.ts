import { Routes } from '@angular/router';

// Owner: Mazen — Phase 4: AI & Reviews
export const reviewsRoutes: Routes = [
  {
    path: ':jobId',
    loadComponent: () =>
      import('./review-form/review-form.component').then((m) => m.ReviewFormComponent),
  },
];
