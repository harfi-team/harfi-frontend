import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ── History interfaces ────────────────────────────────────────
export interface AiSessionSummary {
  sessionId: string;
  title: string;
  lastMessage: string;
  lastActivity: string;
  messageCount: number;
}


export interface AiSessionMsg {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  images: string[];
  audio?: string;
  craftsmenResult?: {
    craftsmen: any[];
    service: string | null;
    city: string | null;
  };
}
export interface AiSessionDetail {
  sessionId: string;
  title: string;
  messages: AiSessionMsg[];
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/AI`;

  // ── Chat ────────────────────────────────────────────────────
  sendChat3(request: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/chat3`, request);
  }

  analyzeMedia(
    images: File[],
    audio: Blob | null,
    userText: string | null,
    extractedService: string | null,
    extractedCity: string | null,
    extractedCount: number | null,
    userId: number | null,
    sessionId: string,
  ): Observable<any> {
    const form = new FormData();
    for (const img of images) form.append('images', img);
    if (audio) form.append('audio', audio, 'recording.wav');
    if (userText) form.append('userText', userText);
    if (extractedService) form.append('extractedService', extractedService);
    if (extractedCity) form.append('extractedCity', extractedCity);
    if (extractedCount != null) form.append('extractedCount', String(extractedCount));
    if (userId != null) form.append('userId', String(userId));
    form.append('sessionId', sessionId);
    return this.http.post(`${this.baseUrl}/analyze-media`, form);
  }

  // ── History ─────────────────────────────────────────────────
  getSessions(userId: number): Observable<AiSessionSummary[]> {
    return this.http.get<AiSessionSummary[]>(`${this.baseUrl}/sessions/${userId}`);
  }

  getSessionDetail(userId: number, sessionId: string): Observable<AiSessionDetail> {
    return this.http.get<AiSessionDetail>(`${this.baseUrl}/sessions/${userId}/${sessionId}`);
  }

  saveMessage(
    userId: number,
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
  ): Observable<any> {
    const form = new FormData();
    form.append('userId', String(userId));
    form.append('sessionId', sessionId);
    form.append('role', role);
    form.append('content', content);
    return this.http.post(`${this.baseUrl}/sessions/message`, form);
  }

  deleteSession(userId: number, sessionId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/sessions/${userId}/${sessionId}`);
  }
  saveMessageWithCraftsmen(
  userId: number,
  sessionId: string,
  role: string,
  content: string,
  craftsmenJson?: string
): Observable<any> {
  const fd = new FormData();
  fd.append('userId', userId.toString());
  fd.append('sessionId', sessionId);
  fd.append('role', role);
  fd.append('content', content);
  if (craftsmenJson) fd.append('craftsmenJson', craftsmenJson);
  return this.http.post(`${this.baseUrl}/sessions/message`, fd);
}
}