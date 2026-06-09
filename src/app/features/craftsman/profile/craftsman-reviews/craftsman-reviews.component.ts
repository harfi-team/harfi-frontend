import { ChangeDetectorRef, Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { ReviewsService } from '../../../reviews/reviews.service';
import { CraftsmanReviewsResponse } from '../../../../core/models/review.models';

@Component({
  selector: 'app-craftsman-reviews',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './craftsman-reviews.component.html',
  styleUrls: ['./craftsman-reviews.comp.css'],
})
export class CraftsmanReviewsComponent implements OnInit {
  /**
   * craftsmanId passed from parent (craftsman profile page)
   * Usage: <app-craftsman-reviews [craftsmanId]="craftsman.id" />
   */
  @Input() craftsmanId!: number;

  private reviewsService = inject(ReviewsService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef); // ← زود دي

  // UI state
  data: CraftsmanReviewsResponse | null = null;
  isLoading = true;
  hasError = false;

  // Show only 3 reviews initially
  showAll = false;
  visibleCount = 3;

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews(): void {
    this.isLoading = true;
    this.hasError = false;

    this.reviewsService
      .getCraftsmanReviews(1022)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.data = res;
          this.isLoading = false;
          this.cdr.detectChanges(); // ← زود دي
        },
        error: () => {
          this.isLoading = false;
          this.hasError = true;
          this.cdr.detectChanges(); // ← زود دي
        },
      });
  }

  // Returns reviews to display based on showAll flag
  get visibleReviews() {
    if (!this.data) return [];
    return this.showAll ? this.data.reviews : this.data.reviews.slice(0, this.visibleCount);
  }

  // Toggle show more / show less
  toggleShowAll(): void {
    this.showAll = !this.showAll;
  }

  // Returns array for rendering filled stars [1,1,1,0,0] for 3 stars
  getStarsArray(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => (i < rating ? 1 : 0));
  }

  // Format date — "15 يناير 2024"
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
