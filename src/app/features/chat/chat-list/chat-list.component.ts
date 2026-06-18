import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnDestroy, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';
import { ChatService } from '../chat.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { ChatHubService } from '../../../core/hubs/chat.hub.service';
import { ConversationDto } from '../../../core/models/chat.models';
import { TokenService } from '../../../core/services/token.service';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
      
const BACKGROUND_REFRESH_INTERVAL_MS = 10000;
const REFRESH_THROTTLE_MS = 1200;

@Component({
  standalone: true,
  selector: 'app-chat-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule, RelativeTimePipe, SpinnerComponent],
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.css']
})
export class ChatListComponent implements OnDestroy {
  private chatService = inject(ChatService);
  private chatHub = inject(ChatHubService);
  private router = inject(Router);
  private tokenSvc = inject(TokenService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);

  private isLoadingConversations = false;
  private backgroundRefreshTimer: ReturnType<typeof setInterval> | null = null;
  private pendingRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSuccessfulRefreshAt = 0;
  private isDestroyed = false; 

  readonly currentUserId = this.tokenSvc.getUser()?.id ?? 0;

  readonly conversations = signal<ConversationDto[]>([]);
  readonly loading = signal(true);

  readonly confirmDeleteConvId = signal<number | null>(null);
  readonly deletingConv = signal(false);

  private readonly incomingConversationUpdated = toSignal(this.chatHub.conversationUpdated$, {
    initialValue: null as ConversationDto | null
  });

  private readonly incomingOnline = toSignal(this.chatHub.userOnline$, {
    initialValue: null as number | null
  });

  private readonly incomingOffline = toSignal(this.chatHub.userOffline$, {
    initialValue: null as number | null
  });

  private readonly connectionState = toSignal(this.chatHub.connectionState$, {
    initialValue: 'disconnected' as 'disconnected' | 'connecting' | 'connected'
  });

  constructor() {
    this.loadConversations();

    this.chatHub.connectionState$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => {
        if (this.isDestroyed) return;
        if (state === 'connected') {
          this.scheduleRefresh(0);
        }
      });

    // Refresh conversations periodically to pick up online status changes
    this.startBackgroundRefresh();

    // 2. مراقبة تحديث المحادثات
    this.chatHub.conversationUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(updatedConversation => {
        if (!updatedConversation || this.isDestroyed) return;
        this.applyConversationUpdate(updatedConversation);
      });

    // 3. مراقبة الأونلاين
   this.chatHub.userOffline$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(userId => {
        if (!userId || this.isDestroyed) return;

        this.conversations.update(list =>
          list.map(c => c.otherUserId === userId ? { ...c, isOnline: false } : c)
        );

        this.cdr.markForCheck();
      });

    this.chatHub.userOnline$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(userId => {
        if (!userId || this.isDestroyed) return;

        this.conversations.update(list =>
          list.map(c => c.otherUserId === userId ? { ...c, isOnline: true } : c)
        );

        this.cdr.markForCheck();
      });
  }

  loadConversations(): void {
    if (this.isLoadingConversations || this.isDestroyed) return;

    this.isLoadingConversations = true;
    this.chatService
      .getConversations()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          if (this.isDestroyed) return;
          this.conversations.set(this.sortConversations(data));
          this.lastSuccessfulRefreshAt = Date.now();
          this.loading.set(false);
          this.isLoadingConversations = false;
        },
        error: () => {
          this.loading.set(false);
          this.isLoadingConversations = false;
        }
      });
  }

  openChat(id: number, event?: Event): void {
    if (event) event.stopPropagation();

    this.conversations.update(list =>
      list.map(c => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );

    this.router.navigate(['/chat', id]);
  }

  requestDeleteConv(convId: number, event: Event): void {
    event.stopPropagation();
    this.confirmDeleteConvId.set(convId);
  }

  cancelDeleteConv(): void {
    this.confirmDeleteConvId.set(null);
    this.deletingConv.set(false);
  }

  confirmDeleteConv(): void {
    const convId = this.confirmDeleteConvId();
    if (!convId) return;

    this.deletingConv.set(true);
    this.chatService.deleteConversation(convId).subscribe({
      next: () => {
        this.conversations.update(list => list.filter(c => c.id !== convId));
        this.confirmDeleteConvId.set(null);
        this.deletingConv.set(false);
        this.errorHandler.success(this.translate.instant('CHAT.DELETE_CONV_SUCCESS'));
      },
      error: () => {
        this.deletingConv.set(false);
      }
    });
  }

  onCardKeydown(event: KeyboardEvent, id: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openChat(id);
    }
  }

  initials(name: string | null | undefined): string {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  }

  getImageUrl(path: string | null | undefined): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${environment.apiBaseUrl.replace('/api', '')}${path}`;
  }

  trackById(_index: number, conv: ConversationDto): number {
    return conv.id;
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;

    this.stopBackgroundRefresh();
    if (this.pendingRefreshTimer) {
      clearTimeout(this.pendingRefreshTimer);
      this.pendingRefreshTimer = null;
    }
  }

  private applyConversationUpdate(updatedConversation: ConversationDto): void {
    const list = this.conversations();
    const convIndex = list.findIndex(c => c.id === updatedConversation.id);

    if (convIndex >= 0) {
      const current = list[convIndex];
      const merged: ConversationDto = {
        ...current,
        ...updatedConversation
      };

      this.conversations.set([
        merged,
        ...list.slice(0, convIndex),
        ...list.slice(convIndex + 1)
      ]);
      return;
    }

    this.conversations.set([updatedConversation, ...list]);
  }

  isImageLastMessage(conv: ConversationDto): boolean {
    return conv.lastMessageType === 'image';
  }

  isVoiceLastMessage(conv: ConversationDto): boolean {
    return conv.lastMessageType === 'voice';
  }

  isLocationLastMessage(conv: ConversationDto): boolean {
    return conv.lastMessageType === 'location';
  }

  getConversationPreview(conv: ConversationDto): string {
    return conv.lastMessage ?? '';
  }

  private scheduleRefresh(minDelayMs: number): void {
    if (this.isDestroyed) return;

    const elapsedMs = Date.now() - this.lastSuccessfulRefreshAt;
    const throttleDelay = Math.max(0, REFRESH_THROTTLE_MS - elapsedMs);
    const delayMs = Math.max(minDelayMs, throttleDelay);

    if (this.pendingRefreshTimer) {
      clearTimeout(this.pendingRefreshTimer);
      this.pendingRefreshTimer = null;
    }

    this.pendingRefreshTimer = setTimeout(() => {
      this.pendingRefreshTimer = null;
      this.loadConversations();
    }, delayMs);
  }

  private startBackgroundRefresh(): void {
    if (this.backgroundRefreshTimer || this.isDestroyed) return;

    this.backgroundRefreshTimer = setInterval(() => {
      this.scheduleRefresh(0);
    }, BACKGROUND_REFRESH_INTERVAL_MS);
  }

  private stopBackgroundRefresh(): void {
    if (!this.backgroundRefreshTimer) return;
    clearInterval(this.backgroundRefreshTimer);
    this.backgroundRefreshTimer = null;
  }

  private sortConversations(list: ConversationDto[]): ConversationDto[] {
    return [...list].sort((a, b) => {
      const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bt - at;
    });
  }
}