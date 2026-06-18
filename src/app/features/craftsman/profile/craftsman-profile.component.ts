import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { CraftsmanDto, CraftsmanReviewsResponse } from '../../../core/models/craftsman.models';
import { CraftsmanService } from '../craftsman.service';
import { CraftsmanReviewsComponent } from './craftsman-reviews/craftsman-reviews.component';

@Component({
  selector: 'app-craftsman-profile',
  standalone: true,
  imports: [CommonModule, TranslateModule, CraftsmanReviewsComponent],
  templateUrl: './craftsman-profile.component.html',
  styleUrl: './craftsman-profile.component.css',
})
export class CraftsmanProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private craftsmanService = inject(CraftsmanService);
  private auth = inject(AuthService);
  private languageService = inject(LanguageService);

  loading = signal(true);
  craftsman = signal<CraftsmanDto | null>(null);
  readonly isCustomer = this.auth.getRole() === 'customer';

  direction = computed(() => this.languageService.current() === 'ar' ? 'rtl' : 'ltr');

  // ── ملخص التقييمات: متوسط النجوم + عدد المراجعات ──
  reviewsSummary = signal<CraftsmanReviewsResponse | null>(null);

  // ── التبويب النشط فى منطقة المحتوى (نبذة / أعمال سابقة / مراجعات) ──
  activeTab = signal<'about' | 'portfolio' | 'reviews'>('about');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';

    this.craftsmanService.getCraftsman(id).subscribe({
      next: (data) => {
        this.craftsman.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.craftsman.set(null);
        this.loading.set(false);
      },
    });

    // ── جلب ملخص المراجعات (متوسط التقييم + العدد) لعرضه فى البطاقة الجانبية ──
    if (id) {
      this.craftsmanService.getCraftsmanReviews(id).subscribe({
        next: (res) => this.reviewsSummary.set(res),
        error: () =>
          this.reviewsSummary.set({
            craftsmanId: Number(id),
            totalReviews: 0,
            averageStars: 0,
            reviews: [],
          }),
      });
    }

    // ── فتح تبويب المراجعات إذا كان رابط الإشعار يحمل ?tab=reviews ──
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'reviews') {
      this.activeTab.set('reviews');
    }
  }

  // CraftsmanReviewsComponent expects a number @Input
  craftsmanId = computed(() => Number(this.route.snapshot.paramMap.get('id') ?? 0));

  setTab(tab: 'about' | 'portfolio' | 'reviews'): void {
    this.activeTab.set(tab);
  }

  assignJob(craftsman: CraftsmanDto): void {
    const service = this.craftsmanService.getPrimaryService(craftsman);
    this.router.navigate(['/jobs/create'], {
      queryParams: {
        craftsmanId: craftsman.id,
        craftsmanName: craftsman.name,
        service: service || undefined,
      },
    });
  }

  getPriceRange(craftsman: CraftsmanDto): string {
    return this.craftsmanService.getPriceRange(craftsman);
  }

  getServiceLabel(craftsman: CraftsmanDto): string {
    const service = this.craftsmanService.getPrimaryService(craftsman);
    return service ? `SERVICES.${service.toUpperCase()}` : this.getServiceName(craftsman);
  }

  getImageUrl(path: string | null | undefined): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${environment.apiBaseUrl.replace('/api', '')}${path}`;
  }

  getServiceName(craftsman: CraftsmanDto): string {
    const isArabic = this.languageService.current() === 'ar';
    if (isArabic && craftsman.serviceNameAr) {
      return craftsman.serviceNameAr;
    }
    if (!isArabic && craftsman.serviceNameEn) {
      return craftsman.serviceNameEn;
    }
    return craftsman.specialty;
  }

  // ── متوسط التقييم: من ملخص المراجعات أولاً، وإلا من بيانات الحرفي نفسه ──
  displayRating(craftsman: CraftsmanDto): number {
    const summary = this.reviewsSummary();
    if (summary && summary.totalReviews > 0) return summary.averageStars;
    return craftsman.rating;
  }

  displayReviewsCount(craftsman: CraftsmanDto): number {
    const summary = this.reviewsSummary();
    if (summary) return summary.totalReviews;
    return craftsman.reviewsCount;
  }
}