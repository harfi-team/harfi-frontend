import { Injectable, signal, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Language = 'ar' | 'en';

const STORAGE_KEY = 'harfi_lang';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  current = signal<Language>(
    (localStorage.getItem(STORAGE_KEY) as Language) === 'en' ? 'en' : 'ar'
  );

  private translate = inject(TranslateService);

  constructor() {
    this.apply(this.current());
  }

  switchTo(lang: Language): void {
    this.current.set(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    this.apply(lang);
  }

  toggle(): void {
    const targetLang: Language = this.current() === 'ar' ? 'en' : 'ar';
    this.switchTo(targetLang);
  }

  private apply(lang: Language): void {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    this.translate.use(lang);
  }
}