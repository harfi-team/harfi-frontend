import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
  {
    path: 'welcome',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/splash/splash.component').then(m => m.SplashComponent),
  },
  {
    path: 'auth',
    loadComponent: () => import('./shared/layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes),
  },
  {
    path: '',
    loadComponent: () => import('./shared/layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadChildren: () =>
          import('./features/home/home.routes').then(m => m.HOME_ROUTES),
      },
      {
        path: 'craftsmen',
        loadChildren: () => import('./features/craftsman/craftsman.routes').then(m => m.craftsmanRoutes),
      },
      {
        path: 'user',
        loadChildren: () => import('./features/user/user.routes').then(m => m.userRoutes),
      },
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes),
        canActivate: [roleGuard(['admin'])],
      },
      {
        path: 'jobs',
        loadChildren: () => import('./features/jobs/jobs.routes').then(m => m.jobsRoutes),
      },
      {
        path: 'reviews',
        loadChildren: () => import('./features/reviews/reviews.routes').then(m => m.reviewsRoutes),
      },
      {
        path: 'chat',
        loadChildren: () => import('./features/chat/chat.routes').then(m => m.chatRoutes),
      },
      {
        path: 'notifications',
        loadChildren: () => import('./features/notifications/notifications.routes').then(m => m.notificationsRoutes),
      },
      {
        path: 'ai',
        loadChildren: () => import('./features/ai/ai.routes').then(m => m.aiRoutes),
      },
    ],
  },
  { path: '**', redirectTo: 'welcome' },
];
