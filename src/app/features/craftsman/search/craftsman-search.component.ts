import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { LanguageService } from '../../../core/services/language.service';

export interface SearchCraftsmanDto {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  profileImageUrl: string | null;
  serviceType: string;
  serviceNameAr?: string;
  serviceNameEn?: string;
  city: string;
  neighborhood: string | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  experience: number;
  rating: number;
  bio: string;
}

type ServiceOption = {
  id: number | null;
  value: string;
  labelKey: string;
  backendValue: string;
  originalNameEn?: string;
  count?: number;
};

type SortOption = {
  value: string;
  labelKey: string;
  icon?: string;
};

type RatingOption = {
  value: number;
  stars: ('filled' | 'empty')[];
  labelKey?: string;
};

@Component({
  selector: 'app-craftsman-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './craftsman-search.component.html',
  styleUrl: './craftsman-search.component.css',
})
export class CraftsmanSearchComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);
  private languageService = inject(LanguageService);

  loading = signal(false);
  craftsmen = signal<SearchCraftsmanDto[]>([]);
  activeService = signal<string>('');

  readonly canBook = signal(this.authService.getRole() === 'customer');

  private rawServices = signal<any[]>([]);
  serviceOptions = computed<ServiceOption[]>(() => {
    const isArabic = this.languageService.current() === 'ar' || !this.languageService.current();
    return this.rawServices().map((s) => ({
      id: s.id ?? null,
      value: s.nameAr,
      labelKey: isArabic ? s.nameAr : s.nameEn,
      backendValue: s.nameAr,
      originalNameEn: s.nameEn?.toLowerCase(),
    }));
  });

  selectedService = signal<string>('');

  private rawCities = signal<any[]>([]);
  cityOptions = computed<{ value: string; labelKey: string }[]>(() => {
    const isArabic = this.languageService.current() === 'ar' || !this.languageService.current();
    return this.rawCities().map((c) => ({
      value: c.nameAr,
      labelKey: isArabic ? c.nameAr : (c.nameEn || c.nameAr),
    }));
  });

  // Sort
  sortOptions: SortOption[] = [
    { value: 'rating_desc', labelKey: 'SORT.HIGHEST_RATING', icon: 'star' },
    { value: 'price_asc', labelKey: 'SORT.LOWEST_PRICE' },
    { value: 'experience_desc', labelKey: 'SORT.MOST_EXPERIENCED' },
  ];
  activeSortValue = 'rating_desc';

  // Rating filter
  ratingOptions: RatingOption[] = [
    { value: 5, stars: ['filled', 'filled', 'filled', 'filled', 'filled'] },
    { value: 4, stars: ['filled', 'filled', 'filled', 'filled', 'empty'], labelKey: 'RATING.AND_ABOVE' },
    { value: 3, stars: ['filled', 'filled', 'filled', 'empty', 'empty'], labelKey: 'RATING.AND_ABOVE' },
  ];
  selectedMinRating: number | null = null;

  // Price
  maxPrice = 1000;

  // Pagination
  currentPage = 1;
  pageSize = 9;

  get totalPages(): number {
    return Math.ceil(this.craftsmen().length / this.pageSize);
  }

  // Standalone form controls (search bar + experience separate from sidebar)
  searchControl = new FormControl('');
  minExperienceControl = new FormControl<number | ''>('');

  // Legacy formGroup kept for submit/clear compat
  form = new FormGroup({
    search: this.searchControl,
    service: new FormControl<string>(''),
    city: new FormControl(''),
    minRating: new FormControl<number | ''>(''),
    minExperience: this.minExperienceControl,
  });

  ngOnInit(): void {
    this.loadServices();
    this.loadCities();

    this.searchControl.valueChanges
      .pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.submit());

    this.minExperienceControl.valueChanges
      .pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.submit());
  }

  loadServices(): void {
    this.loading.set(true);

    this.http.get<any[]>('http://localhost:5108/api/Craftsmen/active-services').subscribe({
      next: (data) => {
        this.rawServices.set(data);
        this.loading.set(false);
        this.initRouteSubscription();
      },
      error: (err) => {
        console.error('[Harfi] Failed to load services', err);
        this.loading.set(false);
        this.initRouteSubscription();
      },
    });
  }

  loadCities(): void {
    this.http.get<any[]>('http://localhost:5108/api/Craftsmen/active-cities').subscribe({
      next: (data) => {
        this.rawCities.set(data);
      },
      error: (err) => {
        console.error('[Harfi] Failed to load cities', err);
      },
    });
  }

  private initRouteSubscription(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        let incomingService = params.get('service') || '';

        if (incomingService) {
          const matchedOption = this.serviceOptions().find(
            (o) =>
              o.value === incomingService ||
              o.originalNameEn === incomingService.toLowerCase() ||
              o.backendValue === incomingService
          );
          if (matchedOption) {
            incomingService = matchedOption.value;
          }
        }

        this.activeService.set(incomingService);
        this.selectedService.set(incomingService);

        this.form.patchValue(
          {
            service: incomingService,
            search: params.get('search') || '',
            city: params.get('city') || '',
            minRating: this.normalizeNumber(params.get('minRating')),
            minExperience: this.normalizeNumber(params.get('minExperience')),
          },
          { emitEvent: false }
        );

        this.currentPage = 1;
        this.loadCraftsmen();
      });
  }

  // ── Service selection ────────────────────────────────────
  onServiceChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedService.set(value);
    this.activeService.set(value);
    this.form.patchValue({ service: value }, { emitEvent: false });
    this.submit();
  }

  // ── City selection ───────────────────────────────────────
  onCityChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.form.patchValue({ city: value }, { emitEvent: false });
    this.submit();
  }

  // ── Sort ─────────────────────────────────────────────────
  onSortChange(value: string): void {
    this.activeSortValue = value;
    this.applySorting();
  }

  private applySorting(): void {
    const sorted = [...this.craftsmen()];
    if (this.activeSortValue === 'rating_desc') {
      sorted.sort((a, b) => b.rating - a.rating);
    } else if (this.activeSortValue === 'price_asc') {
      sorted.sort((a, b) => (a.priceRangeMin ?? Infinity) - (b.priceRangeMin ?? Infinity));
    } else if (this.activeSortValue === 'experience_desc') {
      sorted.sort((a, b) => b.experience - a.experience);
    }
    this.craftsmen.set(sorted);
    this.currentPage = 1;
  }

  // ── Rating ───────────────────────────────────────────────
  onRatingChange(value: number): void {
    this.selectedMinRating = value;
    this.form.patchValue({ minRating: value }, { emitEvent: false });
    this.submit();
  }

  // ── Price ────────────────────────────────────────────────
  onPriceInput(event: Event): void {
    this.maxPrice = Number((event.target as HTMLInputElement).value);
  }

  onPriceChange(event: Event): void {
    this.maxPrice = Number((event.target as HTMLInputElement).value);
    this.submit();
  }

  // ── Pagination ───────────────────────────────────────────
  paginatedCraftsmen(): SearchCraftsmanDto[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.craftsmen().slice(start, start + this.pageSize);
  }

  visiblePages(): (number | -1)[] {
    const total = this.totalPages;
    const cur = this.currentPage;
    const pages: (number | -1)[] = [];

    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (cur > 3) pages.push(-1);
      for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) {
        pages.push(i);
      }
      if (cur < total - 2) pages.push(-1);
      pages.push(total);
    }
    return pages;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Submit / Clear ───────────────────────────────────────
  submit(): void {
    this.currentPage = 1;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.buildQueryParamsForRoute(),
    });
  }

  clearFilters(): void {
    this.selectedService.set('');
    this.selectedMinRating = null;
    this.maxPrice = 1000;
    this.form.reset({ search: '', service: '', city: '', minRating: '', minExperience: '' });
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  bookNow(craftsman: SearchCraftsmanDto): void {
    this.router.navigate(['/jobs/create'], {
      queryParams: {
        craftsmanId: craftsman.id,
        craftsmanName: craftsman.fullName,
        service: craftsman.serviceType,
      },
    });
  }

  viewProfile(craftsman: SearchCraftsmanDto): void {
  this.router.navigate(['/craftsmen/profile', craftsman.id]);
}

  getPriceRange(craftsman: SearchCraftsmanDto): string {
    const min = craftsman.priceRangeMin;
    const max = craftsman.priceRangeMax;
    if (min === null && max === null) return '';
    if (min !== null && max !== null) return `${min} - ${max}`;
    return `${min ?? max}`;
  }

  getServiceName(craftsman: SearchCraftsmanDto): string {
    const isArabic = this.languageService.current() === 'ar';
    if (isArabic && craftsman.serviceNameAr) return craftsman.serviceNameAr;
    if (!isArabic && craftsman.serviceNameEn) return craftsman.serviceNameEn;
    return craftsman.serviceType;
  }

  get activeServiceLabel(): string {
    if (!this.activeService()) {
      return this.translate.instant('CRAFTSMEN_FILTER.ALL_SERVICES');
    }
    const option = this.serviceOptions().find((o) => o.value === this.activeService());
    if (!option) return this.activeService();
    return option.value === ''
      ? this.translate.instant(option.labelKey)
      : option.labelKey;
  }

  private loadCraftsmen(): void {
    this.loading.set(true);
    const raw = this.form.getRawValue();

    let params = new HttpParams();
    const selectedOption = this.serviceOptions().find((opt) => opt.value === raw.service);
    const backendServiceType = selectedOption ? selectedOption.backendValue : '';

    if (backendServiceType) params = params.set('serviceType', backendServiceType);
    if (raw.city) params = params.set('city', raw.city.trim());
    if (raw.minRating !== '' && raw.minRating !== null)
      params = params.set('minRating', raw.minRating.toString());
    if (raw.minExperience !== '' && raw.minExperience !== null)
      params = params.set('minExperience', raw.minExperience.toString());

    this.http
      .get<SearchCraftsmanDto[]>('http://localhost:5108/api/craftsmen/search', { params })
      .subscribe({
        next: (items) => {
          const localSearch = raw.search?.trim().toLowerCase() || '';

          let filtered = localSearch
            ? items.filter(
                (c) =>
                  (c.fullName && c.fullName.toLowerCase().includes(localSearch)) ||
                  (c.serviceType && c.serviceType.toLowerCase().includes(localSearch)) ||
                  (c.bio && c.bio.toLowerCase().includes(localSearch)) ||
                  (c.neighborhood && c.neighborhood.toLowerCase().includes(localSearch))
              )
            : items;

          this.craftsmen.set(filtered);
          this.applySorting();
          this.loading.set(false);
        },
        error: (err) => {
          console.error('[Harfi] Search failed', err);
          this.craftsmen.set([]);
          this.loading.set(false);
        },
      });
  }

  private buildQueryParamsForRoute(): any {
    const raw = this.form.getRawValue();
    return {
      service: raw.service || undefined,
      search: raw.search?.trim() || undefined,
      city: raw.city?.trim() || undefined,
      minRating: raw.minRating !== '' ? raw.minRating : undefined,
      minExperience: raw.minExperience !== '' ? raw.minExperience : undefined,
    };
  }

  private normalizeNumber(value: string | null): number | '' {
    if (value === null || value === '') return '';
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : '';
  }
}
