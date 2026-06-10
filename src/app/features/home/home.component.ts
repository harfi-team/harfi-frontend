import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

interface Service {
  icon: string;
  labelKey: string;
  variant: string;
}

interface Craftsman {
  nameKey: string;
  specialtyKey: string;
  rating: number;
  reviews: number;
  distance: string;
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
  imports: [RouterLink, RouterLinkActive, TranslateModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  auth = inject(AuthService);
  languageService = inject(LanguageService);

  get greeting(): string {
    const hour = new Date().getHours();
    const isArabic = this.languageService.current() === 'ar';
    if (hour < 12) return isArabic ? 'صباح الخير' : 'Good Morning';
    if (hour < 17) return isArabic ? 'مساء الخير' : 'Good Afternoon';
    return isArabic ? 'مساء النور' : 'Good Evening';
  }

  services: Service[] = [
    { icon: 'plumbing',            labelKey: 'SERVICES.PLUMBING',    variant: 'primary'   },
    { icon: 'electrical_services', labelKey: 'SERVICES.ELECTRICAL',  variant: 'secondary' },
    { icon: 'carpenter',           labelKey: 'SERVICES.CARPENTRY',   variant: 'tertiary'  },
    { icon: 'format_paint',        labelKey: 'SERVICES.PAINTING',    variant: 'neutral'   },
    { icon: 'ac_unit',             labelKey: 'SERVICES.AC',          variant: 'primary'   },
    { icon: 'cleaning_services',   labelKey: 'SERVICES.CLEANING',    variant: 'error'     },
    { icon: 'local_shipping',      labelKey: 'SERVICES.MOVING',      variant: 'secondary' },
    { icon: 'pest_control',        labelKey: 'SERVICES.PEST',        variant: 'tertiary'  },
    { icon: 'roofing',             labelKey: 'SERVICES.ROOFING',     variant: 'primary'   },
    { icon: 'more_horiz',          labelKey: 'SERVICES.MORE',        variant: 'neutral'   },
  ];

  craftsmen: Craftsman[] = [
    { nameKey: 'CRAFTSMEN.MAHMOUD', specialtyKey: 'CRAFTSMEN.PLUMBER',      rating: 4.9, reviews: 120, distance: '2' },
    { nameKey: 'CRAFTSMEN.SAEED',   specialtyKey: 'CRAFTSMEN.ELECTRICIAN',  rating: 4.8, reviews: 85,  distance: '3.5' },
    { nameKey: 'CRAFTSMEN.YASSER',  specialtyKey: 'CRAFTSMEN.CARPENTER',    rating: 5.0, reviews: 42,  distance: '5' },
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

  ngOnInit(): void {}
}