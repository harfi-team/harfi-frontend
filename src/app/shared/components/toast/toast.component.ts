import { Component, inject, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { ToastMessage } from '../../../core/models/api-error.models';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [NgClass],
  template: `
    @if (message) {
      <div class="toast-container" [ngClass]="'toast--' + message.type">
        <span class="toast-text">{{ message.message }}</span>
        <button class="toast-close" (click)="dismiss()">&times;</button>
      </div>
    }
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 99999;
      padding: .875rem 1.25rem;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      display: flex;
      align-items: center;
      gap: .75rem;
      max-width: 420px;
      animation: slideDown .3s ease;
      direction: ltr;
    }
    .toast--success { background: var(--success); color: #fff; }
    .toast--error   { background: var(--error); color: #fff; }
    .toast--info    { background: var(--info); color: #fff; }
    .toast-text { flex: 1; font-size: .9375rem; font-weight: 500; }
    .toast-close {
      background: none; border: none; color: inherit;
      font-size: 1.25rem; cursor: pointer; line-height: 1; padding: 0;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateX(-50%) translateY(-1rem); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
  `]
})
export class ToastComponent implements OnInit {
  private errorHandler = inject(ErrorHandlerService);
  message: ToastMessage | null = null;
  private timeout: any;

  ngOnInit(): void {
    this.errorHandler.toast$.subscribe(msg => {
      this.message = msg;
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => this.dismiss(), 4000);
    });
  }

  dismiss(): void {
    this.message = null;
    clearTimeout(this.timeout);
  }
}
