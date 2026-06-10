import { inject, Injectable, NgZone } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationDto } from '../models/notification.models';
import { TokenService } from '../services/token.service';

@Injectable({ providedIn: 'root' })
export class NotificationHubService {
  private hub: signalR.HubConnection | null = null;
  private connectPromise: Promise<void> | null = null;

  private readonly token = inject(TokenService);
  private readonly ngZone = inject(NgZone);

  private readonly _notification$ = new BehaviorSubject<NotificationDto | null>(null);
  private readonly _connectionState$ = new BehaviorSubject<'disconnected' | 'connecting' | 'connected'>('disconnected');

  readonly notification$ = this._notification$.asObservable();
  readonly connectionState$ = this._connectionState$.asObservable();

  isConnected(): boolean {
    return this.hub?.state === signalR.HubConnectionState.Connected;
  }

  async connect(): Promise<void> {
    this.ensureHub();
    if (!this.hub) return;

    const state = this.hub.state;
    if (state === signalR.HubConnectionState.Connected || state === signalR.HubConnectionState.Reconnecting) {
      return;
    }

    if (state === signalR.HubConnectionState.Connecting && this.connectPromise) {
      await this.connectPromise;
      return;
    }

    this.ngZone.run(() => this._connectionState$.next('connecting'));

    this.connectPromise = this.hub.start()
      .then(() => {
        this.ngZone.run(() => this._connectionState$.next('connected'));
      })
      .catch((error) => {
        this.ngZone.run(() => this._connectionState$.next('disconnected'));
        throw error;
      })
      .finally(() => {
        this.connectPromise = null;
      });

    await this.connectPromise;
  }

  async disconnect(): Promise<void> {
    const hub = this.hub;
    this.connectPromise = null;

    if (!hub) {
      this.ngZone.run(() => this._connectionState$.next('disconnected'));
      return;
    }

    this.removeHubHandlers(hub);

    try {
      await hub.stop();
    } finally {
      this.hub = null;
      this.ngZone.run(() => this._connectionState$.next('disconnected'));
    }
  }

  private ensureHub(): void {
    if (this.hub) return;

    this.hub = new signalR.HubConnectionBuilder()
      .withUrl(environment.notificationHubUrl, {
        accessTokenFactory: () => this.token.getAccessToken() ?? ''
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
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
    });

    hub.on('ReceiveNotification', (notif: NotificationDto) => {
      this.ngZone.run(() => this._notification$.next(notif));
    });
  }

  private removeHubHandlers(hub: signalR.HubConnection): void {
    hub.off('ReceiveNotification');
  }
}