import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { TranslateModule } from '@ngx-translate/core';
import { CraftsmanDto } from '../../core/models/craftsman.models';
import { CraftsmanService } from '../craftsman/craftsman.service';

interface Service {
  icon: string;
  labelKey: string;
  variant: string;
  slug: string;
}

interface Order {
  icon: string;
  titleKey: string;
  date: string;
  craftsman: string;
  statusKey: string;
  price: string;
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

  loadingCraftsmen = signal(true);
  featuredCraftsmen = signal<CraftsmanDto[]>([]);
  readonly isCustomer = this.auth.getRole() === 'customer';

  get greeting(): string {
    const hour = new Date().getHours();
    const isArabic = this.languageService.current() === 'ar';
    if (hour < 12) return isArabic ? 'صباح الخير' : 'Good Morning';
    if (hour < 17) return isArabic ? 'مساء الخير' : 'Good Afternoon';
    return isArabic ? 'مساء النور' : 'Good Evening';
  }

  services: Service[] = [
    { icon: 'plumbing',            labelKey: 'SERVICES.PLUMBING',    variant: 'primary',   slug: 'plumbing' },
    { icon: 'electrical_services', labelKey: 'SERVICES.ELECTRICAL',  variant: 'secondary', slug: 'electrical' },
    { icon: 'carpenter',           labelKey: 'SERVICES.CARPENTRY',   variant: 'tertiary',  slug: 'carpentry' },
    { icon: 'format_paint',        labelKey: 'SERVICES.PAINTING',    variant: 'neutral',   slug: 'painting' },
    { icon: 'ac_unit',             labelKey: 'SERVICES.AC',          variant: 'primary',   slug: 'ac' },
    { icon: 'cleaning_services',   labelKey: 'SERVICES.CLEANING',    variant: 'error',     slug: 'cleaning' },
    { icon: 'local_shipping',      labelKey: 'SERVICES.MOVING',      variant: 'secondary', slug: 'moving' },
    { icon: 'pest_control',        labelKey: 'SERVICES.PEST',        variant: 'tertiary',  slug: 'pest' },
    { icon: 'roofing',             labelKey: 'SERVICES.ROOFING',     variant: 'primary',   slug: 'roofing' },
    { icon: 'more_horiz',          labelKey: 'SERVICES.MORE',        variant: 'neutral',   slug: '' },
  ];

  orders: Order[] = [
    {
      icon: 'plumbing',
      titleKey: 'ORDERS.LEAK',
      date: 'ORDERS.DATE1',
      craftsman: 'CRAFTSMEN.MAHMOUD',
      statusKey: 'ORDERS.COMPLETED',
      price: '150',
    },
    {
      icon: 'electrical_services',
      titleKey: 'ORDERS.CHANDELIER',
      date: 'ORDERS.DATE2',
      craftsman: 'CRAFTSMEN.SAEED',
      statusKey: 'ORDERS.COMPLETED',
      price: '80',
    },
  ];

  ngOnInit(): void {
    this.loadFeaturedCraftsmen();
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
