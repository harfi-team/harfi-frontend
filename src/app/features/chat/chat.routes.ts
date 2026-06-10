import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { chatResolver } from './chat-resolver';

export const chatRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./chat-list/chat-list.component').then(m => m.ChatListComponent)
      },
      {
        path: ':id',
        resolve: { conversation: chatResolver },
        loadComponent: () =>
          import('./chat-detail/chat-detail.component').then(m => m.ChatDetailComponent)
      }
    ]
  }
];