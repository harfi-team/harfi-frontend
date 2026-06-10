import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, OnDestroy, signal } from '@angular/core';

const LOCATION_COORDS_REGEX = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/;
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NotificationsService } from '../notifications.service';
import { NotificationHubService } from '../../../core/hubs/notification.hub.service';
import { NotificationDto } from '../../../core/models/notification.models';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  standalone: true,
  selector: 'app-notification-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule, RelativeTimePipe, SpinnerComponent],
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.css']
})
export class NotificationListComponent implements OnDestroy {
  private notifService = inject(NotificationsService);
  private notifHub     = inject(NotificationHubService);
  private router       = inject(Router);
  private destroyRef   = inject(DestroyRef);
  private errorTimer: ReturnType<typeof setTimeout> | null = null;

  readonly notifications = signal<NotificationDto[]>([]);
  readonly loading       = signal(true);
  readonly errorMessage  = signal('');

  private readonly incomingNotif = toSignal(this.notifHub.notification$, {
    initialValue: null as NotificationDto | null
  });

  constructor() {
    this.loadNotifications();
    this.notifHub.connect().catch(() => {
      // page still works with polling/API fallback if realtime connection fails
    });

    effect(() => {
      const notif = this.incomingNotif();
      if (!notif) return;

      this.notifications.update(list => {
        if (list.some(n => n.id === notif.id)) return list;
        return [notif, ...list];
      });
      this.syncUnreadCount();
    });
  }

  loadNotifications(): void {
    this.notifService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.notifications.set(data);
          this.syncUnreadCount();
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.errorMessage.set('NOTIFICATIONS.LOAD_FAILED');
        }
      });
  }

  markAsRead(notif: NotificationDto): void {
    if (!notif.isRead) {
      this.notifService
        .markAsRead(notif.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.notifications.update(list =>
              list.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
            );
            this.syncUnreadCount();
          },
          error: () => {
            this.errorMessage.set('NOTIFICATIONS.MARK_FAILED');
            this.scheduleErrorClear(3000);
          }
        });
    }

    switch (notif.type) {
      case 'new_message':
        if (notif.conversationId) {
          this.router.navigate(['/chat', notif.conversationId]);
        }
        break;
      case 'job_accepted':
      case 'job_completed':
      case 'job_rejected':
      case 'new_order':
      case 'new_review':
        if (notif.relatedJobId) {
          this.router.navigate(['/jobs', notif.relatedJobId]);
        }
        break;
    }
  }

  markAllAsRead(): void {
    this.notifService
      .markAllAsRead()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notifications.update(list =>
            list.map(n => ({ ...n, isRead: true }))
          );
          this.notifService.clearUnread();
        },
        error: () => {
          this.errorMessage.set('NOTIFICATIONS.MARK_ALL_FAILED');
          this.scheduleErrorClear(3000);
        }
      });
  }

  deleteNotification(notif: NotificationDto, event: MouseEvent): void {
    event.stopPropagation();

    this.notifService
      .delete(notif.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notifications.update(list => list.filter(n => n.id !== notif.id));
          this.syncUnreadCount();
        },
        error: () => {
          this.errorMessage.set('NOTIFICATIONS.DELETE_FAILED');
          this.scheduleErrorClear(3000);
        }
      });
  }

  clearAllNotifications(): void {
    this.notifService
      .deleteAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notifications.set([]);
          this.notifService.clearUnread();
        },
        error: () => {
          this.errorMessage.set('NOTIFICATIONS.CLEAR_FAILED');
          this.scheduleErrorClear(3000);
        }
      });
  }

  getNotificationIcon(type: string | null): string {
    switch (type) {
      case 'new_message':
        return '💬';
      case 'job_accepted':
        return '✅';
      case 'job_completed':
        return '🎉';
      case 'job_rejected':
        return '❌';
      case 'new_order':
        return '🛠️';
      case 'new_review':
        return '⭐';
      default:
        return '🔔';
    }
  }

  getNotificationBodyTranslationKey(notif: NotificationDto): string | null {
    if (notif.type !== 'new_message') {
      return null;
    }

    const kind = this.detectMessageAttachmentKind(notif.body);

    if (kind === 'image') {
      return 'NOTIFICATIONS.NEW_MESSAGE_IMAGE';
    }

    if (kind === 'voice') {
      return 'NOTIFICATIONS.NEW_MESSAGE_VOICE';
    }

    if (kind === 'location') {
      return 'NOTIFICATIONS.NEW_MESSAGE_LOCATION';
    }

    return null;
  }

  getNotificationBodyText(notif: NotificationDto): string {
    return notif.body;
  }

  ngOnDestroy(): void {
    if (this.errorTimer) {
      clearTimeout(this.errorTimer);
      this.errorTimer = null;
    }
  }

  private syncUnreadCount(): void {
    const unread = this.notifications().filter(n => !n.isRead).length;
    this.notifService.setUnreadCount(unread);
  }

  private detectMessageAttachmentKind(body: string): 'image' | 'voice' | 'location' | 'text' {
    const value = body?.trim();
    if (!value) {
      return 'text';
    }

    const normalized = value.toLowerCase();

    if (
      normalized.includes('📷') ||
      normalized.includes('صورة') ||
      normalized.includes('/upload/chat') ||
      normalized.endsWith('.png') ||
      normalized.endsWith('.jpg') ||
      normalized.endsWith('.jpeg') ||
      normalized.endsWith('.webp')
    ) {
      return 'image';
    }

    if (
      normalized.includes('🎤') ||
      normalized.includes('صوت') ||
      normalized.includes('/upload/chat-voices') ||
      normalized.endsWith('.mp3') ||
      normalized.endsWith('.wav') ||
      normalized.endsWith('.ogg') ||
      normalized.endsWith('.webm')
    ) {
      return 'voice';
    }

    if (
      normalized.includes('📍') ||
      normalized.includes('موقع') ||
      LOCATION_COORDS_REGEX.test(normalized)
    ) {
      return 'location';
    }

    return 'text';
  }

  private scheduleErrorClear(ms: number): void {
    if (this.errorTimer) clearTimeout(this.errorTimer);
    this.errorTimer = setTimeout(() => {
      this.errorMessage.set('');
      this.errorTimer = null;
    }, ms);
  }
}
