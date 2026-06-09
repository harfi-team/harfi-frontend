import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CraftsmanDto, CraftsmanSearchParams, CraftsmanServiceSlug } from '../../core/models/craftsman.models';

@Injectable({ providedIn: 'root' })
export class CraftsmanService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/craftsmen`;

  private readonly slugToArabic: Record<string, string> = {
    plumbing:   'سباك',
    electrical: 'كهربائي',
    carpentry:  'نجار',
    painting:   'نقاش',
    ac:         'فني تكييف',
    cleaning:   'تنظيف',
    moving:     'نقل',
    pest:       'مكافحة حشرات',
    roofing:    'عزل',
  };

  getCraftsman(id: string): Observable<CraftsmanDto | null> {
    return this.http.get<unknown>(`${this.base}/${id}`).pipe(
      map(response => this.normalizeCraftsman(response)),
      catchError(() => of(null)),
    );
  }

  searchCraftsmen(params: CraftsmanSearchParams): Observable<CraftsmanDto[]> {
    let httpParams = new HttpParams();
    if (params.service) {
      const arabicType = this.slugToArabic[params.service] ?? params.service;
      httpParams = httpParams.set('serviceType', arabicType);
    }
    if (params.city) httpParams = httpParams.set('city', params.city);
    if (params.minRating !== undefined && params.minRating !== '') httpParams = httpParams.set('minRating', params.minRating);
    if (params.minExperience !== undefined && params.minExperience !== '') httpParams = httpParams.set('minExperience', params.minExperience);

    return this.http.get<unknown>(`${this.base}/search`, { params: httpParams }).pipe(
      map(response => this.extractList(response).map(item => this.normalizeCraftsman(item))),
      map(items => params.search ? this.filterBySearch(items, params.search) : items),
      catchError(() => of([])),
    );
  }

  getServiceLabel(service: CraftsmanServiceSlug): string {
    return `SERVICES.${service.toUpperCase()}`;
  }

  getPrimaryService(craftsman: CraftsmanDto): CraftsmanServiceSlug | '' {
    return craftsman.services[0] ?? '';
  }

  getPriceRange(craftsman: CraftsmanDto): string {
    const min = craftsman.priceMin ?? craftsman.minPrice ?? null;
    const max = craftsman.priceMax ?? null;

    if (min === null && max === null) return '';
    if (min !== null && max !== null) return `${min} - ${max}`;
    return `${min ?? max}`;
  }

  private extractList(response: unknown): unknown[] {
    if (Array.isArray(response)) return response;
    if (!response || typeof response !== 'object') return [];
    const typed = response as { items?: unknown[]; data?: unknown[]; result?: unknown[] };
    return typed.items ?? typed.data ?? typed.result ?? [];
  }

  private normalizeCraftsman(item: unknown): CraftsmanDto {
    const typed = (item ?? {}) as Record<string, unknown>;
    const services = this.normalizeServices(typed);
    const priceMin = this.pickNumber(typed, ['priceRangeMin', 'PriceRangeMin', 'priceMin', 'minPrice']);
    const priceMax = this.pickNumber(typed, ['priceRangeMax', 'PriceRangeMax', 'priceMax', 'maxPrice']);
    const experienceYears = this.pickNumber(typed, ['experience', 'Experience', 'experienceYears', 'ExperienceYears']) ?? 0;
    const reviewsCount = this.pickNumber(typed, ['reviewsCount', 'ReviewsCount', 'reviewCount', 'ReviewCount']) ?? 0;
    const rating = this.pickNumber(typed, ['rating', 'Rating']) ?? 0;

    return {
      id: String(typed['id'] ?? typed['Id'] ?? typed['craftsmanId'] ?? typed['CraftsmanId'] ?? ''),
      name: String(typed['fullName'] ?? typed['FullName'] ?? typed['name'] ?? typed['Name'] ?? ''),
      city: String(typed['city'] ?? typed['City'] ?? ''),
      specialty: String(typed['serviceType'] ?? typed['ServiceType'] ?? typed['specialty'] ?? typed['Specialty'] ?? ''),
      services,
      rating,
      reviewsCount,
      experienceYears,
      bio: String(typed['bio'] ?? typed['Bio'] ?? typed['description'] ?? typed['Description'] ?? ''),
      avatarUrl: this.pickString(typed, ['profileImageUrl', 'ProfileImageUrl', 'avatarUrl', 'AvatarUrl', 'imageUrl', 'ImageUrl']),
      priceMin: priceMin ?? undefined,
      priceMax: priceMax ?? undefined,
      minPrice: priceMin ?? undefined,
    };
  }

  private normalizeServices(item: Record<string, unknown>): CraftsmanServiceSlug[] {
    const rawServices = item['services'] ?? item['Services'];
    const values: unknown[] = Array.isArray(rawServices)
      ? rawServices
      : rawServices
        ? [rawServices]
        : [
            item['serviceType'],
            item['ServiceType'],
            item['service'],
            item['Service'],
            item['specialty'],
            item['Specialty'],
          ];

    return values
      .map(value => this.normalizeServiceSlug(value))
      .filter((value): value is CraftsmanServiceSlug => Boolean(value));
  }

  private normalizeServiceSlug(value: unknown): CraftsmanServiceSlug | '' {
    if (typeof value !== 'string') return '';

    const normalized = value.trim().toLowerCase();
    const map: Record<string, CraftsmanServiceSlug> = {
      plumbing: 'plumbing',
      'سباكة': 'plumbing',
      'سباك': 'plumbing',
      electrical: 'electrical',
      electricity: 'electrical',
      'كهرباء': 'electrical',
      'كهربائي': 'electrical',
      carpentry: 'carpentry',
      carpenter: 'carpentry',
      'نجارة': 'carpentry',
      'نجار': 'carpentry',
      painting: 'painting',
      painter: 'painting',
      'دهان': 'painting',
      'دهانات': 'painting',
      'دهانة': 'painting',
      'نقاش': 'painting',
      ac: 'ac',
      'ac repair': 'ac',
      'تكييف': 'ac',
      'مكيفات': 'ac',
      'فني تكييف': 'ac',
      cleaning: 'cleaning',
      'تنظيف': 'cleaning',
      moving: 'moving',
      'نقل': 'moving',
      'نقل عفش': 'moving',
      pest: 'pest',
      'pest control': 'pest',
      'مكافحة حشرات': 'pest',
      roofing: 'roofing',
      'عزل أسطح': 'roofing',
      'عزل اسطح': 'roofing',
      'عزل': 'roofing',
    };

    return map[normalized] ?? '';
  }

  private filterBySearch(items: CraftsmanDto[], search: string): CraftsmanDto[] {
    const term = search.toLowerCase();
    return items.filter(item =>
      [item.name, item.specialty, item.bio].join(' ').toLowerCase().includes(term),
    );
  }

  private pickNumber(item: Record<string, unknown>, keys: string[]): number | null {
    for (const key of keys) {
      const value = item[key];
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
      }
    }
    return null;
  }

  private pickString(item: Record<string, unknown>, keys: string[]): string | undefined {
    for (const key of keys) {
      const value = item[key];
      if (typeof value === 'string' && value.trim() !== '') return value;
    }
    return undefined;
  }
}
