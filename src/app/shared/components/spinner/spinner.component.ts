import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [NgClass],
  template: `
    @if (visible) {
      <div [ngClass]="{'spinner-overlay': fullPage, 'spinner-inline': !fullPage}">
        <div class="spinner"></div>
      </div>
    }
  `,
  styles: [`
    .spinner-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.25);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    .spinner-inline {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin .6s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class SpinnerComponent {
  @Input() visible = false;
  @Input() fullPage = false;
}
