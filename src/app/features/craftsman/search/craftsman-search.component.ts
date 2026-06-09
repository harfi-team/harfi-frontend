import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { CraftsmanDto, CraftsmanSearchParams, CraftsmanServiceSlug } from '@core/models/craftsman.models';
import { CraftsmanService } from '../craftsman.service';

type ServiceOption = {
  value: CraftsmanServiceSlug | '';
  labelKey: string;
};

@Component({
  selector: 'app-craftsman-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './craftsman-search.component.html',
  styleUrl: './craftsman-search.component.css',
})
export class CraftsmanSearchComponent implements OnInit {
  private craftsmanService = inject(CraftsmanService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  loading = signal(true);
  craftsmen = signal<CraftsmanDto[]>([]);
  activeService = signal<CraftsmanServiceSlug | ''>('');
  readonly canBook = signal(this.authService.getRole() === 'customer');

  serviceOptions: ServiceOption[] = [
    { value: '', labelKey: 'CRAFTSMEN_FILTER.ALL_SERVICES' },
    { value: 'plumbing', labelKey: 'SERVICES.PLUMBING' },
    { value: 'electrical', labelKey: 'SERVICES.ELECTRICAL' },
    { value: 'carpentry', labelKey: 'SERVICES.CARPENTRY' },
    { value: 'painting', labelKey: 'SERVICES.PAINTING' },
    { value: 'ac', labelKey: 'SERVICES.AC' },
    { value: 'cleaning', labelKey: 'SERVICES.CLEANING' },
    { value: 'moving', labelKey: 'SERVICES.MOVING' },
    { value: 'pest', labelKey: 'SERVICES.PEST' },
    { value: 'roofing', labelKey: 'SERVICES.ROOFING' },
  ];

  form = new FormGroup({
    search: new FormControl(''),
    service: new FormControl<CraftsmanServiceSlug | ''>(''),
    city: new FormControl(''),
    minRating: new FormControl<number | ''>(''),
    minExperience: new FormControl<number | ''>(''),
  });

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const service = this.normalizeService(params.get('service'));
      this.activeService.set(service);
      this.form.patchValue({
        service,
        search: params.get('search') || '',
        city: params.get('city') || '',
        minRating: this.normalizeNumber(params.get('minRating')),
        minExperience: this.normalizeNumber(params.get('minExperience')),
      }, { emitEvent: false });
      this.loadCraftsmen();
    });
  }

  submit(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.buildParams(),
    });
  }

  clearFilters(): void {
    this.form.reset({
      search: '',
      service: '',
      city: '',
      minRating: '',
      minExperience: '',
    });
    this.router.navigate(['/craftsmen']);
  }

  bookNow(craftsman: CraftsmanDto): void {
    this.router.navigate(['/jobs/create'], {
      queryParams: {
        craftsmanId: craftsman.id,
        craftsmanName: craftsman.name,
        service: craftsman.services[0] || this.activeService() || undefined,
      },
    });
  }

  getServiceLabel(service: CraftsmanServiceSlug): string {
    return `SERVICES.${service.toUpperCase()}`;
  }

  getPriceRange(craftsman: CraftsmanDto): string {
    const min = craftsman.priceMin ?? craftsman.minPrice ?? null;
    const max = craftsman.priceMax ?? null;

    if (min === null && max === null) {
      return '';
    }

    if (min !== null && max !== null) {
      return `${min} - ${max}`;
    }

    return `${min ?? max}`;
  }

  get activeServiceLabel(): string {
    if (!this.activeService()) {
      return this.translate.instant('CRAFTSMEN_FILTER.ALL_SERVICES');
    }

    return this.translate.instant(this.getServiceLabel(this.activeService() as CraftsmanServiceSlug));
  }

  private loadCraftsmen(): void {
    this.loading.set(true);
    const params = this.buildParams();

    this.craftsmanService.searchCraftsmen(params).subscribe({
      next: (items) => {
        this.craftsmen.set(items);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorHandler.handle(error);
        this.craftsmen.set([]);
        this.loading.set(false);
      },
    });
  }

  private buildParams(): CraftsmanSearchParams {
    const raw = this.form.getRawValue();
    return {
      service: raw.service || this.activeService(),
      search: raw.search?.trim() || '',
      city: raw.city?.trim() || '',
      minRating: raw.minRating ?? '',
      minExperience: raw.minExperience ?? '',
    };
  }

  private normalizeService(service: string | null): CraftsmanServiceSlug | '' {
    const allowed: CraftsmanServiceSlug[] = ['plumbing', 'electrical', 'carpentry', 'painting', 'ac', 'cleaning', 'moving', 'pest', 'roofing'];
    return allowed.includes(service as CraftsmanServiceSlug) ? service as CraftsmanServiceSlug : '';
  }

  private normalizeNumber(value: string | null): number | '' {
    if (value === null || value === '') return '';
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : '';
  }
}
