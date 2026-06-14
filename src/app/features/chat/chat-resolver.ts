import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ConversationDto } from '../../core/models/chat.models';
import { ChatService } from './chat.service';

export const chatResolver: ResolveFn<ConversationDto | null> = (route) => {
  const id = Number(route.paramMap.get('id'));
  if (!id) return of(null);
  return inject(ChatService).getConversationById(id).pipe(
    catchError(() => of(null))
  );
};
