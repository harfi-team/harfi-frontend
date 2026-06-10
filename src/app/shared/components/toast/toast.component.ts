import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  NgZone,
  inject,
  signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { ToastMessage } from '../../../core/models/api-error.models';

@Component({
  selector: 'app-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  template: `
    @if (message(); as current) {
      <div class="toast-container" [ngClass]="'toast--' + current.type">
        <span class="toast-text">{{ current.message }}</span>
        <button
          type="button"
          class="toast-close"
          aria-label="Close notification"
          (click)="dismiss($event)"
        >
          &times;
        </button>
      </div>
    }
  `,
  styles: [
    `
      :host {
        position: fixed;
        inset: 0;
        z-index: 99999;
        pointer-events: none;
      }
      .toast-container {
        position: absolute;
        top: 1rem;
        left: 50%;
        transform: translateX(-50%);
        padding: 0.875rem 1.25rem;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        max-width: 420px;
        animation: slideDown 0.3s ease;
        direction: ltr;
        pointer-events: auto;
      }
      .toast--success {
        background: var(--success);
        color: #fff;
      }
      .toast--error {
        background: var(--error);
        color: #fff;
      }
      .toast--info {
        background: var(--info);
        color: #fff;
      }
      .toast-text {
        flex: 1;
        font-size: 0.9375rem;
        font-weight: 500;
      }
      .toast-close {
        background: none;
        border: none;
        color: inherit;
        font-size: 1.25rem;
        cursor: pointer;
        line-height: 1;
        padding: 0.125rem 0.25rem;
      }
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-1rem);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    `,
  ],
})
export class ToastComponent {
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  readonly message = signal<ToastMessage | null>(null);
  private timeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.errorHandler.toast$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((msg) => {
      this.ngZone.run(() => {
        this.message.set(msg);
        this.clearTimer();
        this.timeout = setTimeout(() => this.dismiss(), 4000);
        this.cdr.markForCheck();
      });
    });

    this.destroyRef.onDestroy(() => this.clearTimer());
  }

  dismiss(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    this.message.set(null);
    this.clearTimer();
    this.cdr.markForCheck();
  }

  private clearTimer(): void {
    if (!this.timeout) return;
    clearTimeout(this.timeout);
    this.timeout = null;
  }
}
