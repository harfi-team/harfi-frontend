import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
  },
  {
    path: 'craftsmen',
    loadComponent: () =>
      import('./craftsmen/admin-craftsmen.component').then(m => m.AdminCraftsmenComponent),
  },
  {
    path: 'customers',
    loadComponent: () =>
      import('./customers/admin-customers.component').then(m => m.AdminCustomersComponent),
  },
  {
    path: 'jobs',
    loadComponent: () =>
      import('./jobs/admin-jobs.component').then(m => m.AdminJobsComponent),
  },
  {
    path: 'reviews',
    loadComponent: () =>
      import('./reviews/admin-reviews.component').then(m => m.AdminReviewsComponent),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./settings/admin-settings.component').then(m => m.AdminSettingsComponent),
  },
];
