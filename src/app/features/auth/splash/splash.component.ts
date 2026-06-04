import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ThemeService } from '../../../core/services/theme.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [RouterLink, NgClass, TranslatePipe],
  templateUrl: './splash.component.html',
  styleUrl: './splash.component.css',
})
export class SplashComponent implements OnInit {
  private router = inject(Router);

  ngOnInit(): void {
    localStorage.removeItem('harfi_onboarded');
  }
  theme = inject(ThemeService);
  language = inject(LanguageService);

  currentSlide = 0;

  slides = [
    {
      icon: '🔍',
      titleKey: 'ONBOARDING_S1_TITLE',
      titleParts: ['ابحث عن ', 'الحرفي', ' المناسب'],
      gradientWord: 'الحرفي',
      descKey: 'ONBOARDING_S1_DESC',
    },
    {
      icon: '💬',
      titleKey: 'ONBOARDING_S2_TITLE',
      titleParts: ['تواصل ', 'واتفق', ' مباشرة'],
      gradientWord: 'واتفق',
      descKey: 'ONBOARDING_S2_DESC',
    },
    {
      icon: '⭐',
      titleKey: 'ONBOARDING_S3_TITLE',
      titleParts: ['جودة ', 'مضمونة', ' 100%'],
      gradientWord: 'مضمونة',
      descKey: 'ONBOARDING_S3_DESC',
    },
  ];

  get isLastSlide(): boolean {
    return this.currentSlide === this.slides.length - 1;
  }

  next(): void {
    if (this.isLastSlide) {
      this.completeOnboarding();
    } else {
      this.currentSlide++;
    }
  }

  skip(): void {
    this.completeOnboarding();
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
  }

  private completeOnboarding(): void {
    localStorage.setItem('harfi_onboarded', 'true');
    this.router.navigate(['/auth/login']);
  }

  goToRegister(): void {
    localStorage.setItem('harfi_onboarded', 'true');
    this.router.navigate(['/auth/register']);
  }
}
