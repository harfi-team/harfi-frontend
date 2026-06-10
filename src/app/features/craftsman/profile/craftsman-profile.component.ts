import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
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

  loading = signal(true);
  craftsman = signal<CraftsmanDto | null>(null);
  reviews = signal<any[]>([]);
  averageRating = signal<number>(0);
  totalReviews = signal<number>(0);
  readonly isCustomer = this.auth.getRole() === 'customer';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';

    // Restored from HEAD: load profile and reviews in parallel via forkJoin
    forkJoin({
      craftsman: this.craftsmanService.getCraftsman(id),
      reviews: this.craftsmanService.getCraftsmanReviews(id),
    }).subscribe({
      next: ({ craftsman, reviews }) => {
        this.craftsman.set(craftsman);
        this.reviews.set(reviews?.reviews ?? []);
        this.averageRating.set(reviews?.averageStars ?? 0);
        this.totalReviews.set(reviews?.totalReviews ?? 0);
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
    return service ? `SERVICES.${service.toUpperCase()}` : craftsman.specialty;
  }

  getStars(rating: number): number[] {
    return Array(Math.round(rating)).fill(0);
  }
}