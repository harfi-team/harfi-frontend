import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../../core/services/theme.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './splash.component.html',
  styleUrl: './splash.component.css',
})
export class SplashComponent {
  private router = inject(Router);
  private translate = inject(TranslateService);
  theme = inject(ThemeService);
  lang = inject(LanguageService);

  currentSlide = 0;

  slides = [
    { id: 0, icon: '🔍', title: 'ONBOARDING_S1_TITLE', gradientWord: 'SPLASH_GRADIENT_S1', desc: 'ONBOARDING_S1_DESC' },
    { id: 1, icon: '💬', title: 'ONBOARDING_S2_TITLE', gradientWord: 'SPLASH_GRADIENT_S2', desc: 'ONBOARDING_S2_DESC' },
    { id: 2, icon: '⭐', title: 'ONBOARDING_S3_TITLE', gradientWord: 'SPLASH_GRADIENT_S3', desc: 'ONBOARDING_S3_DESC' }
  ];

  get isDark() { return this.theme.current() === 'dark'; }
  get isArabic() { return this.lang.current() === 'ar'; }

  getSlideTitle(slide: any): string {
    const full = this.translate.instant(slide.title);
    const word = this.translate.instant(slide.gradientWord);
    return full.replace(word, `<span class="gradient-text">${word}</span>`);
  }

  goToLogin() { localStorage.setItem('harfi_onboarded','true'); this.router.navigate(['/auth/login']); }
  goToRegister() { localStorage.setItem('harfi_onboarded','true'); this.router.navigate(['/auth/register']); }
  skip() { this.goToLogin(); }
  nextSlide() { if (this.currentSlide < 2) this.currentSlide++; }
}
