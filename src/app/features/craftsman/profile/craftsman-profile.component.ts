import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { CraftsmanDto } from '../../../core/models/craftsman.models';
import { CraftsmanService } from '../craftsman.service';

@Component({
  selector: 'app-craftsman-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
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
}
