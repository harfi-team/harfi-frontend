import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { TranslateModule } from '@ngx-translate/core';
import { CraftsmanDto } from '../../core/models/craftsman.models';
import { CraftsmanService } from '../craftsman/craftsman.service';
import { JobsService } from '../jobs/jobs.service';
import { JobDto, JobStatus } from '../../core/models/job.models';
import { HttpClient } from '@angular/common/http'; // 1. ضفنا الـ HttpClient

interface DynamicService {
  icon: string;
  name: string;
  variant: string;
  slug: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, TranslateModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})

export class HomeComponent implements OnInit {
 auth = inject(AuthService);
  languageService = inject(LanguageService);
  private router = inject(Router);
  private craftsmanService = inject(CraftsmanService);
  private jobsService = inject(JobsService);
  private http = inject(HttpClient); // 3. عملنا Inject للـ HttpClient

  loadingCraftsmen = signal(true);
  loadingOrders = signal(false);
  loadingServices = signal(true); // 4. Signal لحالة التحميل الخاصة بالخدمات

  private rawServices = signal<any[]>([]);
  featuredCraftsmen = signal<CraftsmanDto[]>([]);
  recentOrders = signal<JobDto[]>([]);
  dynamicServices = computed<DynamicService[]>(() => {
    const isArabic = this.languageService.current() === 'ar' || !this.languageService.current();
    const variants = ['primary', 'secondary', 'tertiary', 'neutral', 'error'];
    return this.rawServices().map((s, index) => ({
      icon: s.icon || 'handyman',
      name: isArabic ? s.nameAr : s.nameEn,
      variant: variants[index % variants.length],
      slug: s.nameAr,
    }));
  });

  detectedCity = signal<string | null>(null);
  filteringByCity = signal(false);

  readonly isCustomer = this.auth.getRole() === 'customer';
  readonly isCraftsman = this.auth.getRole() === 'craftsman';

  get greeting(): string {
    const hour = new Date().getHours();
    const isArabic = this.languageService.current() === 'ar';
    if (hour < 12) return isArabic ? 'صباح الخير' : 'Good Morning';
    if (hour < 17) return isArabic ? 'مساء الخير' : 'Good Afternoon';
    return isArabic ? 'مساء النور' : 'Good Evening';
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadActiveServices(); // 6. نادينا على الدالة أول ما الصفحة تفتح
    this.loadRecentOrders();
    this.initLocationAndCraftsmen();
  }

  // 7. الدالة الجديدة اللي بتكلم الـ API
  loadActiveServices(): void {
    this.loadingServices.set(true);

    this.http.get<any[]>('http://localhost:5108/api/Craftsmen/active-services').subscribe({
      next: (data) => {
        this.rawServices.set(data);
        this.loadingServices.set(false);
      },
      error: (err) => {
        console.error('[Harfi] Failed to load services', err);
        this.loadingServices.set(false);
      }
    });
  }

  // ─── Geolocation ────────────────────────────────────────────────────────────

  async initLocationAndCraftsmen(): Promise<void> {
    console.log('[Harfi] initLocationAndCraftsmen called');

    if (!navigator.geolocation) {
      console.warn('[Harfi] Geolocation not supported by this browser');
      this.loadFeaturedCraftsmen();
      return;
    }

    // Direct check for permission status if supported
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const permStatus = await navigator.permissions.query({ name: 'geolocation' });
        console.log('[Harfi] Geolocation permission state:', permStatus.state);

        if (permStatus.state === 'denied') {
          console.warn('[Harfi] Location permission is denied — loading all craftsmen');
          this.loadFeaturedCraftsmen();
          return;
        }
      } catch (err) {
        console.warn('[Harfi] navigator.permissions.query failed:', err);
      }
    }

    // If granted or prompt, or if permissions API not supported, request position
    this.requestPosition();
  }

  requestPosition(): void {
    console.log('[Harfi] Requesting position...');
    this.loadingCraftsmen.set(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log('[Harfi] Position received:', pos.coords.latitude, pos.coords.longitude);
        this.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        console.warn('[Harfi] getCurrentPosition error — code:', err.code, '— message:', err.message);
        this.loadFeaturedCraftsmen();
      },
      {
        enableHighAccuracy: true, // Set to true for better accuracy, especially in Egypt's denser cities
        timeout: 15000,           // Increased to 15 seconds to give the GPS enough time to respond
        maximumAge: 300_000,
      },
    );
  }

  private reverseGeocode(lat: number, lng: number): void {
    const lang = this.languageService.current() || 'ar';
    console.log('[Harfi] Reverse geocoding with lang:', lang);

    // Removed the manual User-Agent header and added the email parameter per Nominatim's policy
    const url = 
      `https://nominatim.openstreetmap.org/reverse` +
      `?lat=${lat}&lon=${lng}&format=json&accept-language=${lang}&email=your_email@example.com`; // Add your actual dev email here

    // Standard fetch without the forbidden header
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('Network response was not ok');
        return r.json();
      })
      .then((data) => {
        const addr = data?.address ?? {};
        const city: string =
          addr.city ||
          addr.town ||
          addr.village ||
          addr.suburb ||
          addr.neighbourhood ||
          addr.county ||
          addr.state ||
          '';

        console.log('[Harfi] Detected city:', city);

        if (city) {
          this.detectedCity.set(city);
          this.loadCraftsmenByCity(city);
        } else {
          this.loadFeaturedCraftsmen();
        }
      })
      .catch((err) => {
        console.error('[Harfi] Reverse geocode failed:', err);
        this.loadFeaturedCraftsmen();
      });
  }

  

  private loadCraftsmenByCity(city: string): void {
  this.loadingCraftsmen.set(true);

  // تمرير الـ 4 باراميترز كاملة للـ API بناءً على طلب الـ Backend
  this.craftsmanService.searchCraftsmen({
    city: city,
    service: '',          // نص فاضي عشان يجيب كل التخصصات والخدمات في طنطا
    minExperience: 0,     // 0 عشان يرجع كل سنوات الخبرة
    minRating: 0          // 0 عشان يرجع كل التقييمات
  }).subscribe({
    next: (all) => {
      
      const norm = (s: string) => {
        if (!s) return '';
        return s
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[أإآ]/g, 'ا')          
          .replace(/ة/g, 'ه')             
          .replace(/ى/g, 'ي');            
      };

      const cityNorm = norm(city);

      // فلترة للتأكد التام من دقة النصوص (عربي أو إنجليزي)
      const local = all.filter((c) => {
        if (!c.city) return false;
        const cNorm = norm(c.city);
        
        return cNorm.includes(cityNorm) || cityNorm.includes(cNorm) || 
               (cityNorm === 'طنطا' && cNorm.includes('tanta')) ||
               (cityNorm === 'tanta' && cNorm.includes('طنطا'));
      });

      if (local.length > 0) {
        this.filteringByCity.set(true);
        // ترتيب الحرفيين اللي في طنطا من الأعلى تقييماً للأقل
        this.featuredCraftsmen.set(
          [...local].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 6)
        );
      } else {
        this.filteringByCity.set(false);
        this.loadFeaturedCraftsmen();
      }

      this.loadingCraftsmen.set(false);
    },
    error: () => {
      this.loadFeaturedCraftsmen();
    },
  });
}

loadFeaturedCraftsmen(): void {
  this.loadingCraftsmen.set(true);
  
  // تحديث الـ Fallback أيضاً بالـ 4 باراميترز الأساسية بقيم فارغة ليعود بالجميع
  this.craftsmanService.searchCraftsmen({
    city: '',
    service: '',
    minExperience: 0,
    minRating: 0
  }).subscribe({
    next: (craftsmen) => {
      this.featuredCraftsmen.set(
        [...craftsmen]
          .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
          .slice(0, 6),
      );
      this.loadingCraftsmen.set(false);
    },
    error: () => {
      this.featuredCraftsmen.set([]);
      this.loadingCraftsmen.set(false);
    },
  });
}

 
  // ─── Orders ─────────────────────────────────────────────────────────────────

  loadRecentOrders(): void {
    const id = this.isCraftsman ? this.auth.getCraftsmanId() : this.auth.getUserId();
    if (!id) { this.recentOrders.set([]); return; }

    this.loadingOrders.set(true);
    const req = this.isCraftsman
      ? this.jobsService.getCraftsmanJobs(id)
      : this.jobsService.getCustomerJobs(id);

    req.subscribe({
      next: (jobs) => {
        const sorted = [...jobs].sort(
          (a, b) =>
            new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime(),
        );
        this.recentOrders.set(sorted.slice(0, 5));
        this.loadingOrders.set(false);
      },
      error: () => {
        this.recentOrders.set([]);
        this.loadingOrders.set(false);
      },
    });
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  getStatusLabelKey(status: JobStatus): string {
    const map: Record<string, string> = {
      'open':        'JOBS.STATUS_OPEN',
      'in-progress': 'JOBS.STATUS_IN_PROGRESS',
      'done':        'JOBS.STATUS_DONE',
      'rejected':    'JOBS.STATUS_REJECTED',
    };
    return map[status] ?? 'JOBS.STATUS_OPEN';
  }

  getStatusClass(status: JobStatus): string {
    return `order-status order-status--${status}`;
  }

  getServiceIcon(serviceType: string): string {
    if (!serviceType) return 'handyman';
    const iconMap: Record<string, string> = {
      'سباك':          'plumbing',
      'كهربائي':       'electrical_services',
      'نجار':          'carpenter',
      'نقاش':          'format_paint',
      'تكييف':         'ac_unit',
      'نظافة':         'cleaning_services',
      'نقل':           'local_shipping',
      'مكافحة حشرات': 'pest_control',
      plumbing:        'plumbing',
      electrical:      'electrical_services',
      carpentry:       'carpenter',
      painting:        'format_paint',
      ac:              'ac_unit',
      cleaning:        'cleaning_services',
      moving:          'local_shipping',
      pest:            'pest_control',
    };
    return iconMap[serviceType] ?? 'handyman';
  }

  getPrimaryServiceLabel(craftsman: CraftsmanDto): string {
    const service = this.craftsmanService.getPrimaryService(craftsman);
    return service ? `SERVICES.${service.toUpperCase()}` : craftsman.specialty;
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

  getPriceRange(craftsman: CraftsmanDto): string {
    return this.craftsmanService.getPriceRange(craftsman);
  }

  applyNow(craftsman: CraftsmanDto): void {
    const service = this.craftsmanService.getPrimaryService(craftsman);
    this.router.navigate(['/jobs/create'], {
      queryParams: {
        craftsmanId:   craftsman.id,
        craftsmanName: craftsman.name,
        service:       service || undefined,
      },
    });
  }

  onSearch(value: string): void {
  if (!value.trim()) return;
  
  // بنوجه العميل لصفحة البحث وبنحط الكلمة اللي كتبها في الـ search param
  this.router.navigate(['/craftsmen'], {
    queryParams: { search: value.trim() }
  });
}

selectService(serviceSlug: string): void {
  this.router.navigate(['/craftsmen'], {
    queryParams: { service: serviceSlug }
  });
}
}