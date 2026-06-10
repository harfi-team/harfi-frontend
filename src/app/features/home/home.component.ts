import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { TranslateModule } from '@ngx-translate/core';
import { CraftsmanDto } from '../../core/models/craftsman.models';
import { CraftsmanService } from '../craftsman/craftsman.service';
import { JobsService } from '../jobs/jobs.service';
import { JobDto, JobStatus } from '../../core/models/job.models';

interface Service {
  icon: string;
  labelKey: string;
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

  loadingCraftsmen = signal(true);
  loadingOrders = signal(false);
  featuredCraftsmen = signal<CraftsmanDto[]>([]);
  recentOrders = signal<JobDto[]>([]);
  readonly isCustomer = this.auth.getRole() === 'customer';
  readonly isCraftsman = this.auth.getRole() === 'craftsman';

  get greeting(): string {
    const hour = new Date().getHours();
    const isArabic = this.languageService.current() === 'ar';
    if (hour < 12) return isArabic ? 'صباح الخير' : 'Good Morning';
    if (hour < 17) return isArabic ? 'مساء الخير' : 'Good Afternoon';
    return isArabic ? 'مساء النور' : 'Good Evening';
  }

  services: Service[] = [
    { icon: 'plumbing', labelKey: 'SERVICES.PLUMBING', variant: 'primary', slug: 'plumbing' },
    {
      icon: 'electrical_services',
      labelKey: 'SERVICES.ELECTRICAL',
      variant: 'secondary',
      slug: 'electrical',
    },
    { icon: 'carpenter', labelKey: 'SERVICES.CARPENTRY', variant: 'tertiary', slug: 'carpentry' },
    { icon: 'format_paint', labelKey: 'SERVICES.PAINTING', variant: 'neutral', slug: 'painting' },
    { icon: 'ac_unit', labelKey: 'SERVICES.AC', variant: 'primary', slug: 'ac' },
    {
      icon: 'cleaning_services',
      labelKey: 'SERVICES.CLEANING',
      variant: 'error',
      slug: 'cleaning',
    },
    { icon: 'local_shipping', labelKey: 'SERVICES.MOVING', variant: 'secondary', slug: 'moving' },
    { icon: 'pest_control', labelKey: 'SERVICES.PEST', variant: 'tertiary', slug: 'pest' },
    { icon: 'roofing', labelKey: 'SERVICES.ROOFING', variant: 'primary', slug: 'roofing' },
    { icon: 'more_horiz', labelKey: 'SERVICES.MORE', variant: 'neutral', slug: '' },
  ];

  ngOnInit(): void {
    this.loadFeaturedCraftsmen();
    this.loadRecentOrders();
  }

  loadRecentOrders(): void {
    const id = this.isCraftsman ? this.auth.getCraftsmanId() : this.auth.getUserId();
    if (!id) {
      this.recentOrders.set([]);
      return;
    }

    this.loadingOrders.set(true);
    const request = this.isCraftsman
      ? this.jobsService.getCraftsmanJobs(id)
      : this.jobsService.getCustomerJobs(id);

    request.subscribe({
      next: (jobs) => {
        const sorted = [...jobs].sort(
          (a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime(),
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

  getStatusLabelKey(status: JobStatus): string {
    switch (status) {
      case 'open':
        return 'JOBS.STATUS_OPEN';
      case 'in-progress':
        return 'JOBS.STATUS_IN_PROGRESS';
      case 'done':
        return 'JOBS.STATUS_DONE';
      case 'rejected':
        return 'JOBS.STATUS_REJECTED';
      default:
        return 'JOBS.STATUS_OPEN';
    }
  }

  getStatusClass(status: JobStatus): string {
    return `order-status order-status--${status}`;
  }

  getServiceIcon(serviceType: string): string {
    if (!serviceType) return 'handyman';
    const iconMap: Record<string, string> = {
      سباك: 'plumbing',
      كهربائي: 'electrical_services',
      نجار: 'carpenter',
      نقاش: 'format_paint',
      تكييف: 'ac_unit',
      نظافة: 'cleaning_services',
      نقل: 'local_shipping',
      'مكافحة حشرات': 'pest_control',
      plumbing: 'plumbing',
      electrical: 'electrical_services',
      carpentry: 'carpenter',
      painting: 'format_paint',
      ac: 'ac_unit',
      cleaning: 'cleaning_services',
      moving: 'local_shipping',
      pest: 'pest_control',
    };
    return iconMap[serviceType] ?? 'handyman';
  }

  loadFeaturedCraftsmen(): void {
    this.loadingCraftsmen.set(true);
    this.craftsmanService.searchCraftsmen({}).subscribe({
      next: (craftsmen) => {
        this.featuredCraftsmen.set(
          [...craftsmen]
            .sort((left, right) => (right.rating ?? 0) - (left.rating ?? 0))
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

  getPrimaryServiceLabel(craftsman: CraftsmanDto): string {
    const service = this.craftsmanService.getPrimaryService(craftsman);
    return service ? `SERVICES.${service.toUpperCase()}` : craftsman.specialty;
  }

  getPriceRange(craftsman: CraftsmanDto): string {
    return this.craftsmanService.getPriceRange(craftsman);
  }

  applyNow(craftsman: CraftsmanDto): void {
    const service = this.craftsmanService.getPrimaryService(craftsman);
    this.router.navigate(['/jobs/create'], {
      queryParams: {
        craftsmanId: craftsman.id,
        craftsmanName: craftsman.name,
        service: service || undefined,
      },
    });
  }
}
