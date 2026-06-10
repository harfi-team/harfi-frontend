import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationDto, UnreadCountDto } from '../../core/models/notification.models';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/Notifications`;

  readonly unreadCount = signal(0);


  getAll(): Observable<NotificationDto[]> {
    return this.http.get<NotificationDto[]>(this.base);
  }

  getUnreadCount(): Observable<UnreadCountDto> {
    return this.http.get<UnreadCountDto>(`${this.base}/unread-count`);
  }

  markAsRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/read`, {});
  }

        markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.base}/read-all`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  deleteAll(): Observable<void> {
    return this.http.delete<void>(`${this.base}/clear`);
  }


  setUnreadCount(count: number): void {
    this.unreadCount.set(Math.max(0, count));
  }

  incrementUnread(): void {
    this.unreadCount.update(c => c + 1);
  }

  decrementUnread(): void {
    this.unreadCount.update(c => Math.max(0, c - 1));
  }

  clearUnread(): void {
    this.unreadCount.set(0);
  }
}