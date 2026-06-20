import { Directive, ElementRef, effect, inject } from '@angular/core';
import { LanguageService } from '../../core/services/language.service';

@Directive({
  selector: 'input[rtlForm], textarea[rtlForm]',
  standalone: true,
})
export class RtlFormDirective {
  private el = inject(ElementRef<HTMLInputElement | HTMLTextAreaElement>);
  private languageService = inject(LanguageService);

  constructor() {
    effect(() => {
      const lang = this.languageService.current();
      const isAr = lang === 'ar';
      this.el.nativeElement.style.textAlign = isAr ? 'right' : 'left';
      this.el.nativeElement.dir = isAr ? 'rtl' : 'ltr';
    });
  }
}
