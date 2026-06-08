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
    path: 'craftsmen/:id',
    loadComponent: () =>
      import('./craftsman-detail/craftsman-detail.component').then(m => m.CraftsmanDetailComponent),
  },
  {
    path: 'customers',
    loadComponent: () =>
      import('./customers/admin-customers.component').then(m => m.AdminCustomersComponent),
  },
  {
    path: 'users/:id',
    loadComponent: () =>
      import('./user-detail/user-detail.component').then(m => m.UserDetailComponent),
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
  {
    path: 'reports',
    loadComponent: () =>
      import('./reports/admin-reports.component').then(m => m.AdminReportsComponent),
  },
  {
    path: 'ai-logs',
    loadComponent: () =>
      import('./ai-logs/ai-logs.component').then(m => m.AiLogsComponent),
  },
  {
    path: 'audit-logs',
    loadComponent: () =>
      import('./audit-logs/audit-logs.component').then(m => m.AuditLogsComponent),
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./analytics/admin-analytics.component').then(m => m.AdminAnalyticsComponent),
  },
];
