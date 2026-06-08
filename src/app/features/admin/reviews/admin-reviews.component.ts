import { Component, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService } from '../admin.service';
import { ReviewAdminDto } from '@core/models/admin.models';
import { ErrorHandlerService } from '@core/services/error-handler.service';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, DecimalPipe],
  templateUrl: './admin-reviews.component.html',
  styleUrl: './admin-reviews.component.css',
})
export class AdminReviewsComponent {
  private adminService = inject(AdminService);
  private errorHandler = inject(ErrorHandlerService);

  reviews = signal<ReviewAdminDto[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  pageSize = 10;
  search = signal('');

  constructor() {
    this.loadReviews();
  }

  loadReviews(): void {
    this.loading.set(true);
    this.adminService.getReviews({
      search: this.search() || undefined,
      page: this.page(),
      pageSize: this.pageSize,
    }).subscribe({
      next: (data) => {
        this.reviews.set(data.items);
        this.total.set(data.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(): void {
    this.page.set(1);
    this.loadReviews();
  }

  changePage(p: number): void {
    this.page.set(p);
    this.loadReviews();
  }

  deleteReview(id: string): void {
    this.adminService.deleteReview(id).subscribe({
      next: () => {
        this.errorHandler.success('تم حذف التقييم');
        this.loadReviews();
      },
    });
  }

  get totalPages(): number {
    return Math.ceil(this.total() / this.pageSize) || 1;
  }

  get startEntry(): number {
    return (this.page() - 1) * this.pageSize + 1;
  }

  get endEntry(): number {
    return Math.min(this.page() * this.pageSize, this.total());
  }

  starsArray(rating: number): number[] {
    return Array(Math.round(rating)).fill(0);
  }

  emptyStarsArray(rating: number): number[] {
    return Array(5 - Math.round(rating)).fill(0);
  }
}
