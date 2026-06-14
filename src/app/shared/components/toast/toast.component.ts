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
      <div class="toast-wrapper" [ngClass]="'toast--' + current.type">
        <div class="toast-content">
          <!-- Icon dynamically changes based on type -->
          <div class="toast-icon">
            <span class="material-symbols-outlined">
              {{ getIcon(current.type) }}
            </span>
          </div>
          
          <div class="toast-body">
            <span class="toast-text">{{ current.message }}</span>
          </div>

          <button
            type="button"
            class="toast-close"
            aria-label="Close"
            (click)="dismiss($event)"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <!-- Progress bar to show time remaining -->
        <div class="toast-progress"></div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        position: fixed;
        top: 1.5rem;
        right: 1.5rem;
        z-index: 999999;
        pointer-events: none;
        direction: ltr;
      }

      .toast-wrapper {
        pointer-events: auto;
        min-width: 320px;
        max-width: 450px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 
                    0 8px 10px -6px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        position: relative;
        border-left: 5px solid transparent;
        animation: toastIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      }

      .toast-content {
        display: flex;
        align-items: center;
        padding: 1rem 1.25rem;
        gap: 1rem;
      }

      .toast-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        border-radius: 10px;
        flex-shrink: 0;
      }

      .toast-icon .material-symbols-outlined {
        font-size: 22px;
      }

      .toast-body {
        flex: 1;
      }

      .toast-text {
        color: #1f2937;
        font-size: 0.95rem;
        font-weight: 500;
        line-height: 1.4;
      }

      .toast-close {
        background: none;
        border: none;
        color: #9ca3af;
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
      }

      .toast-close:hover {
        background: rgba(0, 0, 0, 0.05);
        color: #4b5563;
      }

      .toast-close .material-symbols-outlined {
        font-size: 18px;
      }

      /* Type Variations */
      .toast--success {
        border-left-color: #10b981;
      }
      .toast--success .toast-icon {
        background: rgba(16, 185, 129, 0.15);
        color: #059669;
      }

      .toast--error {
        border-left-color: #ef4444;
      }
      .toast--error .toast-icon {
        background: rgba(239, 68, 68, 0.15);
        color: #dc2626;
      }

      .toast--info {
        border-left-color: #3b82f6;
      }
      .toast--info .toast-icon {
        background: rgba(59, 130, 246, 0.15);
        color: #2563eb;
      }

      /* Progress Bar Animation */
      .toast-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        width: 100%;
        background: rgba(0, 0, 0, 0.05);
      }

      .toast-progress::after {
        content: '';
        position: absolute;
        left: 0;
        height: 100%;
        width: 100%;
        background: inherit;
        animation: progress 4s linear forwards;
        background: currentColor;
        filter: brightness(0.8);
        opacity: 0.4;
      }

      .toast--success .toast-progress { color: #10b981; }
      .toast--error .toast-progress { color: #ef4444; }
      .toast--info .toast-progress { color: #3b82f6; }

      @keyframes toastIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes progress {
        from { width: 100%; }
        to { width: 0%; }
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

  getIcon(type: string): string {
    switch (type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      default: return 'info';
    }
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