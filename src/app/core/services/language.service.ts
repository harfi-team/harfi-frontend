import { Injectable, signal, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Language = 'ar' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  current = signal<Language>(
    (() => {
      const saved = localStorage.getItem('harfi_lang') as Language | null;
      if (saved === 'ar' || saved === 'en') return saved;
      localStorage.setItem('harfi_lang', 'ar');
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
      return 'ar';
    })()
  );

  private translate = inject(TranslateService);

  constructor() {
    this.apply(this.current());
  }

  switchTo(lang: Language): void {
    this.current.set(lang);
    localStorage.setItem('harfi_lang', lang);
    this.apply(lang);
  }

  toggle(): void {
    const next = this.current() === 'ar' ? 'en' : 'ar';
    this.switchTo(next);
  }

  private apply(lang: Language): void {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    this.translate.use(lang);
  }
}