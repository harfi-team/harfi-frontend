import { Injectable, signal, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Language = 'ar' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  current = signal<Language>('ar');
  private translate = inject(TranslateService);

  constructor() {
    let lang = localStorage.getItem('harfi_lang') as Language | null;
    if (lang !== 'ar' && lang !== 'en') {
      lang = 'ar';
      localStorage.setItem('harfi_lang', 'ar');
    }
    this.current.set(lang);
    this.apply(lang);
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
