import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationHubService } from '../hubs/notification.hub.service';
import { ChatHubService } from '../hubs/chat.hub.service';
import { NotificationsService } from '../../features/notifications/notifications.service';
import { ErrorHandlerService } from './error-handler.service';
import { AuthService } from './auth.service';
import { NotificationDto } from '../models/notification.models';
import { MessageDto } from '../models/chat.models';

@Injectable({ providedIn: 'root' })
export class RealtimeNotificationOrchestratorService {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifHub = inject(NotificationHubService);
  private readonly chatHub = inject(ChatHubService);
  private readonly notifService = inject(NotificationsService);
  private readonly errorHandler = inject(ErrorHandlerService);

  private subscriptions = new Subscription();
  private readonly recentToastKeys = new Map<string, number>();

  private started = false;

  start(): void {
    if (this.started || !this.auth.isLoggedIn()) return;
    this.started = true;
    this.subscriptions = new Subscription();

    this.subscriptions.add(
      this.notifService.getUnreadCount().subscribe({
        next: d => this.notifService.setUnreadCount(d.unreadCount)
      })
    );

    this.notifHub.connect().catch(() => {});
    this.chatHub.connect().catch(() => {});

    this.subscriptions.add(
      this.notifHub.notification$.subscribe(notif => {
        if (!notif) return;

        if (notif.type === 'new_message' && this.isViewingConversation(notif.conversationId)) {
          return;
        }

        this.notifService.incrementUnread();
        const message = [notif.title, notif.body].filter(Boolean).join(' - ');
        const key = this.notificationToastKey(notif);
        this.showToastWithSound(message, key);
      })
    );

    this.subscriptions.add(
      this.chatHub.message$.subscribe(msg => {
        if (!msg) return;
        if (msg.senderId === this.auth.getUserId()) return;
        if (this.isViewingConversation(msg.conversationId)) return;

        const preview = this.mapMessagePreview(msg);
        const message = `${msg.senderName}: ${preview}`;
        const key = this.chatMessageToastKey(msg);
        this.showToastWithSound(message, key);
      })
    );
  }

  async stop(): Promise<void> {
    this.subscriptions.unsubscribe();
    this.recentToastKeys.clear();
    this.started = false;

    await Promise.allSettled([
      this.chatHub.disconnect(),
      this.notifHub.disconnect(),
    ]);
  }

  private showToastWithSound(message: string, key: string): void {
  if (!this.auth.isLoggedIn()) return;
  if (!message || !this.shouldEmitToast(key)) return;

  this.errorHandler.info(message);
  this.playNotificationSound();
}

  private shouldEmitToast(key: string): boolean {
    const now = Date.now();
    const maxAgeMs = 2000;

    for (const [existingKey, at] of this.recentToastKeys.entries()) {
      if (now - at > maxAgeMs) {
        this.recentToastKeys.delete(existingKey);
      }
    }

    const at = this.recentToastKeys.get(key);
    if (at && now - at <= maxAgeMs) {
      return false;
    }

    this.recentToastKeys.set(key, now);
    return true;
  }

  private notificationToastKey(notif: NotificationDto): string {
    if (notif.type === 'new_message') {
      const title = this.normalize(notif.title);
      const body = this.normalize(notif.body);
      return `new_message:${title}:${body}`;
    }

    return `notif:${notif.id}`;
  }

  private chatMessageToastKey(msg: MessageDto): string {
    const sender = this.normalize(msg.senderName);
    const preview = this.normalize(this.mapMessagePreview(msg));
    return `new_message:${sender}:${preview}`;
  }

  private mapMessagePreview(msg: MessageDto): string {
    switch (msg.messageType) {
      case 'image':
        return '📷 image';
      case 'voice':
        return '🎤 voice message';
      case 'location':
        return '📍 location';
      default:
        return msg.content;
    }
  }

  private normalize(value: string | null | undefined): string {
    return (value ?? '').trim().toLowerCase();
  }

  private isViewingConversation(conversationId: number | null | undefined): boolean {
    if (!conversationId) return false;

    const match = this.router.url.match(/\/chat\/(\d+)(?:[/?#]|$)/);
    if (!match) return false;

    return Number(match[1]) === conversationId;
  }

  private audioCtx: AudioContext | null = null;

private getAudioContext(): AudioContext | null {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.audioCtx) {
      this.audioCtx = new AudioCtx();
    }
    return this.audioCtx;
  } catch {
    return null;
  }
}

unlockAudio(): void {
  const ctx = this.getAudioContext();
  if (ctx?.state === 'suspended') {
    void ctx.resume();
  }
}

private playNotificationSound(): void {
  try {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      void ctx.resume().then(() => this.playTones(ctx));
      return;
    }

    this.playTones(ctx);
  } catch {}
}

private playTones(ctx: AudioContext): void {
  const master = ctx.createGain();
  master.gain.value = 0.18;
  master.connect(ctx.destination);

  const playTone = (freq: number, start: number, duration: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine'; // أوضح من triangle
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.3, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  };

  const t = ctx.currentTime;
  playTone(880, t, 0.1);
  playTone(1108, t + 0.12, 0.15);
  playTone(1318, t + 0.27, 0.18);
}
}
