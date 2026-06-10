import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConversationDto, CreateConversationDto, MessageDto } from '../../core/models/chat.models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/Conversations`;

  createConversation(dto: CreateConversationDto): Observable<ConversationDto> {
    return this.http.post<ConversationDto>(this.base, dto);
  }

  getConversations(): Observable<ConversationDto[]> {
    return this.http.get<ConversationDto[]>(this.base);
  }

  getConversationById(id: number): Observable<ConversationDto> {
    return this.http.get<ConversationDto>(`${this.base}/${id}`);
  }

  getMessages(conversationId: number, page = 1, pageSize = 20): Observable<MessageDto[]> {
    return this.http.get<MessageDto[]>(
      `${this.base}/${conversationId}/messages?page=${page}&pageSize=${pageSize}`,
    );
  }

  uploadImage(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${this.base}/upload-image`, formData);
  }

  uploadVoice(file: File): Observable<{ url: string }> {
    const form = new FormData();
    form.append('voice', file);
    return this.http.post<{ url: string }>(`${this.base}/upload-voice`, form);
  }

  deleteMessage(conversationId: number, messageId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${conversationId}/messages/${messageId}`);
  }
}
