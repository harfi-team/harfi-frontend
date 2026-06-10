import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const notificationsRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./notification-list/notification-list.component').then(
        m => m.NotificationListComponent
      )
  }
];
