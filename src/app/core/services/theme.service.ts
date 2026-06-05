import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  current = signal<Theme>('light');

  constructor() {
    const saved = localStorage.getItem('harfi_theme') as Theme | null;
    const theme = saved || 'light';
    this.current.set(theme);
    this.apply(theme);
  }

  toggle(): void {
    const next = this.current() === 'light' ? 'dark' : 'light';
    this.current.set(next);
    localStorage.setItem('harfi_theme', next);
    this.apply(next);
  }

  private apply(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
