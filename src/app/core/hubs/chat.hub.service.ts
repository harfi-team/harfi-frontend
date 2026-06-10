import { inject, Injectable, NgZone } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConversationDto, MessageDto, SendMessageDto } from '../models/chat.models';
import { TokenService } from '../services/token.service';

@Injectable({ providedIn: 'root' })
export class ChatHubService {
  private hub: signalR.HubConnection | null = null;
  private connectPromise: Promise<void> | null = null;
  private started = false;
  private lifecycleHandlersBound = false;

  private readonly token = inject(TokenService);
  private readonly ngZone = inject(NgZone);

  private readonly _messages$ = new BehaviorSubject<MessageDto | null>(null);
  private readonly _typing$ = new BehaviorSubject<{ conversationId: number; userId: number } | null>(null);
  private readonly _read$ = new BehaviorSubject<{ conversationId: number; readerId: number } | null>(null);
  private readonly _deletedMessage$ = new BehaviorSubject<{ conversationId: number; messageId: number } | null>(null);
  private readonly _conversationUpdated$ = new BehaviorSubject<ConversationDto | null>(null);
  private readonly _connectionState$ = new BehaviorSubject<'disconnected' | 'connecting' | 'connected'>('disconnected');
  private readonly _userOnline$ = new Subject<number | null>();
  private readonly _userOffline$ = new Subject<number | null>();
  private readonly offlineUsersStore = new Set<number>();
  private readonly onlineUsersStore = new Set<number>();

  readonly message$ = this._messages$.asObservable();
  readonly typing$ = this._typing$.asObservable();
  readonly read$ = this._read$.asObservable();
  readonly deletedMessage$ = this._deletedMessage$.asObservable();
  readonly conversationUpdated$ = this._conversationUpdated$.asObservable();
  readonly connectionState$ = this._connectionState$.asObservable();
  readonly userOnline$ = this._userOnline$.asObservable();
  readonly userOffline$ = this._userOffline$.asObservable();

  // ── Browser lifecycle handlers ────────────────────────────
  private readonly onBrowserOnline = () => {
    this.reconnectIfNeeded();
  };

  private readonly onBrowserOffline = () => {
    this.ngZone.run(() => this._connectionState$.next('disconnected'));
  };

  private readonly onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      this.reconnectIfNeeded();
    }
  };

  // ── Public API ────────────────────────────────────────────
  async forceReconnect(): Promise<void> {
    this.started = false;
    this.unbindLifecycleHandlers();

    if (this.hub) {
      try {
        await this.hub.invoke('SetOffline').catch(() => {});
        await this.hub.stop().catch(() => {});
      } catch {}
      
      this.hub = null; 
    }

    this.connectPromise = null;
    this.offlineUsersStore.clear();
    this.onlineUsersStore.clear();
    this.ngZone.run(() => this._connectionState$.next('disconnected'));

    await this.connect();
  }

  isConnected(): boolean {
    return this.hub?.state === signalR.HubConnectionState.Connected;
  }

  isUserExplicitlyOffline(userId: number): boolean {
    return this.offlineUsersStore.has(userId);
  }

  isUserRealTimeOnline(userId: number): boolean {
    return this.onlineUsersStore.has(userId);
  }

  async connect(): Promise<void> {
    if (this.started) return;
    this.started = true;
    this.bindLifecycleHandlers();
    await this.startConnection();
  }

  async disconnect(): Promise<void> {
    this.started = false;
    this.unbindLifecycleHandlers();

    if (!this.hub) return;

    if (this.hub.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hub.invoke('SetOffline');
      } catch {}
    }

    try {
      await this.hub.stop();
    } catch {}

    this.hub = null;
    this.connectPromise = null;
    this.offlineUsersStore.clear();
    this.onlineUsersStore.clear();
    this.ngZone.run(() => this._connectionState$.next('disconnected'));
  }

  async joinConversation(conversationId: number): Promise<void> {
    if (!this.hub || !this.isConnected()) return;
    await this.hub.invoke('JoinConversation', conversationId);
  }

  async leaveConversation(conversationId: number): Promise<void> {
    if (!this.hub || !this.isConnected()) return;
    await this.hub.invoke('LeaveConversation', conversationId);
  }

  async sendMessage(dto: SendMessageDto): Promise<void> {
    if (!this.hub || !this.isConnected()) {
      throw new Error('Chat hub is not connected');
    }
    await this.hub.invoke('SendMessage', dto);
  }

  async typing(conversationId: number): Promise<void> {
    if (!this.hub || !this.isConnected()) return;
    await this.hub.invoke('Typing', conversationId);
  }

  async markAsRead(conversationId: number): Promise<void> {
    if (!this.hub || !this.isConnected()) return;
    await this.hub.invoke('MarkAsRead', conversationId);
  }

  async deleteMessage(conversationId: number, messageId: number): Promise<void> {
    if (!this.hub || !this.isConnected()) {
      throw new Error('Chat hub is not connected');
    }
    await this.hub.invoke('DeleteMessage', conversationId, messageId);
  }

  // ── Private ───────────────────────────────────────────────

  private reconnectIfNeeded(): void {
    if (!this.started || this.isConnected()) return;
    void this.startConnection().catch(() => {});
  }

  private async startConnection(): Promise<void> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.ngZone.run(() => this._connectionState$.next('disconnected'));
      return;
    }

    this.ensureHub();
    if (!this.hub) return;

    const state = this.hub.state;
    if (state === signalR.HubConnectionState.Connected || state === signalR.HubConnectionState.Reconnecting) {
      return;
    }

    if (this.connectPromise) {
      await this.connectPromise.catch(() => {});
      return;
    }

    this.ngZone.run(() => this._connectionState$.next('connecting'));

    this.connectPromise = this.hub.start()
      .then(() => {
        this.ngZone.run(() => this._connectionState$.next('connected'));
      })
      .catch(() => {
        this.ngZone.run(() => this._connectionState$.next('disconnected'));
      })
      .finally(() => {
        this.connectPromise = null;
      });

    await this.connectPromise.catch(() => {});
  }

  private ensureHub(): void {
    if (this.hub) return;

    this.hub = new signalR.HubConnectionBuilder()
      .withUrl(environment.chatHubUrl, {
        accessTokenFactory: () => this.token.getAccessToken() ?? ''
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build();

    this.registerHubHandlers(this.hub);
  }

  private registerHubHandlers(hub: signalR.HubConnection): void {
    hub.onreconnecting(() => {
      this.ngZone.run(() => this._connectionState$.next('connecting'));
    });

    hub.onreconnected(() => {
      this.ngZone.run(() => this._connectionState$.next('connected'));
    });

    hub.onclose(() => {
      this.ngZone.run(() => this._connectionState$.next('disconnected'));
      if (this.started) {
        setTimeout(() => this.reconnectIfNeeded(), 5000);
      }
    });

    hub.on('ReceiveMessage', (msg: MessageDto) => {
      this.ngZone.run(() => this._messages$.next(msg));
    });

    hub.on('UserTyping', (conversationIdOrUserId: number, maybeUserId?: number) => {
      const conversationId = typeof maybeUserId === 'number' ? conversationIdOrUserId : 0;
      const userId = typeof maybeUserId === 'number' ? maybeUserId : conversationIdOrUserId;
      this.ngZone.run(() => this._typing$.next({ conversationId, userId }));
    });

    hub.on('MessagesRead', (conversationId: number, readerId?: number) => {
      this.ngZone.run(() => this._read$.next({ conversationId, readerId: readerId ?? 0 }));
    });

    hub.on('MessageDeleted', (conversationId: number, messageId: number) => {
      this.ngZone.run(() => this._deletedMessage$.next({ conversationId, messageId }));
    });

    hub.on('ConversationUpdated', (conversation: ConversationDto) => {
      this.ngZone.run(() => this._conversationUpdated$.next(conversation));
    });

    hub.on('UserOnline', (userId: number) => {
      if (userId) {
        this.onlineUsersStore.add(userId);
        this.offlineUsersStore.delete(userId);
      }
      this.ngZone.run(() => this._userOnline$.next(userId));
    });

    hub.on('UserOffline', (userId: number) => {
      if (userId) {
        this.onlineUsersStore.delete(userId);
        this.offlineUsersStore.add(userId);
      }
      this.ngZone.run(() => this._userOffline$.next(userId));
    });
  }

  private bindLifecycleHandlers(): void {
    if (this.lifecycleHandlersBound || typeof window === 'undefined') return;
    this.lifecycleHandlersBound = true;
    window.addEventListener('online', this.onBrowserOnline);
    window.addEventListener('offline', this.onBrowserOffline);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  private unbindLifecycleHandlers(): void {
    if (!this.lifecycleHandlersBound || typeof window === 'undefined') return;
    this.lifecycleHandlersBound = false;
    window.removeEventListener('online', this.onBrowserOnline);
    window.removeEventListener('offline', this.onBrowserOffline);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }
}