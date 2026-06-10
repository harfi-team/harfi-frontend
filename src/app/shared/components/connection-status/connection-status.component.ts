import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { fromEvent, map, merge, of, startWith } from 'rxjs';
import { ChatHubService } from '../../../core/hubs/chat.hub.service';

@Component({
  standalone: true,
  selector: 'app-connection-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="connection-status" [class]="'connection-status--' + state()">
      <span class="status-dot"></span>
      <span class="status-label">{{ labelKeys[state()] | translate }}</span>
    </div>
  `,
  styles: [
    `
      .connection-status {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 500;
      }
      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .status-label {
        white-space: nowrap;
        color: var(--text-secondary);
      }
      .connection-status--connected .status-dot {
        background: var(--success);
      }
      .connection-status--connecting .status-dot {
        background: var(--warning);
        animation: pulse-dot 1s infinite;
      }
      .connection-status--disconnected .status-dot {
        background: var(--error);
      }
      @keyframes pulse-dot {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.4;
        }
      }
    `,
  ],
})
export class ConnectionStatusComponent {
  private chatHub = inject(ChatHubService);

  readonly labelKeys: Record<string, string> = {
    connected: 'CHAT.CONNECTION_ONLINE',
    connecting: 'CHAT.CONNECTION_CONNECTING',
    disconnected: 'CHAT.CONNECTION_OFFLINE',
  };

  private readonly browserOnline = toSignal(
    typeof window === 'undefined' || typeof navigator === 'undefined'
      ? of(true)
      : merge(
          fromEvent(window, 'online').pipe(map(() => true)),
          fromEvent(window, 'offline').pipe(map(() => false)),
        ).pipe(startWith(navigator.onLine)),
    { initialValue: true },
  );

  private readonly hubState = toSignal(this.chatHub.connectionState$, {
    initialValue: 'disconnected' as const,
  });

  readonly state = computed<'connected' | 'connecting' | 'disconnected'>(() => {
    if (!this.browserOnline()) {
      return 'disconnected';
    }

    const hubState = this.hubState();
    if (hubState === 'connected') return 'connected';
    if (hubState === 'connecting') return 'connecting';
    return 'disconnected';
  });
}
