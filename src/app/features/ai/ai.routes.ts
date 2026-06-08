import { Routes } from '@angular/router';

// Owner: Mazen — Phase 4: AI & Reviews
export const aiRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./ai-chat/ai-chat.component').then((m) => m.AiChatComponent),
  },
];