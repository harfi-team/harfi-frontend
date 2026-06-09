import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

// Owner: Habiba — Phase 3: Lifecycle Management
export const jobsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./job-list/job-list.component').then(m => m.JobListComponent),
    canActivate: [roleGuard(['customer', 'craftsman'])],
  },
  {
    path: 'create',
    loadComponent: () => import('./job-create/job-create.component').then(m => m.JobCreateComponent),
    canActivate: [roleGuard(['customer'])],
  },
];
