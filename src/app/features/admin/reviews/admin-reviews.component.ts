import { Component, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService } from '../admin.service';
import { AdminReview } from '@core/models/admin.models';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, DecimalPipe, ConfirmDialogComponent],
  templateUrl: './admin-reviews.component.html',
  styleUrl: './admin-reviews.component.css',
})
export class AdminReviewsComponent {
  private adminService = inject(AdminService);
  private errorHandler = inject(ErrorHandlerService);

  reviews = signal<AdminReview[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  pageSize = 20;
  search = signal('');
  minStars = signal<number | null>(null);

  viewReview = signal<any | null>(null);

  dialogVisible = signal(false);
  selectedId = signal<number>(0);

  constructor() {
    this.loadReviews();
  }

  loadReviews(): void {
    this.loading.set(true);
    this.adminService.getReviews(undefined, this.minStars() ?? undefined, undefined, this.page(), this.pageSize).subscribe({
      next: (data) => {
        this.reviews.set(data.items);
        this.total.set(data.totalCount);
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

  openView(id: number): void {
    this.adminService.getReviewById(id).subscribe({
      next: (data) => this.viewReview.set(data),
      error: () => this.viewReview.set(null),
    });
  }

  closeView(): void {
    this.viewReview.set(null);
  }

  openDelete(id: number): void {
    this.selectedId.set(id);
    this.dialogVisible.set(true);
  }

  onDeleteConfirmed(reason?: string): void {
    this.adminService.deleteReview(this.selectedId(), reason || 'admin delete').subscribe({
      next: (res) => {
        this.errorHandler.success(res.message || 'تم حذف التقييم');
        this.dialogVisible.set(false);
        this.loadReviews();
      },
      error: () => this.dialogVisible.set(false),
    });
  }

  starsArray(rating: number): number[] {
    return Array(Math.round(rating ?? 0)).fill(0);
  }

  emptyStarsArray(rating: number): number[] {
    return Array(5 - Math.round(rating ?? 0)).fill(0);
  }

  truncate(text: string, max: number): string {
    return text?.length > max ? text.slice(0, max) + '...' : text || '';
  }

  getBadge(r: any): { label: string; cssClass: string } {
    if (r.isDeleted) return { label: 'ADMIN.DELETED', cssClass: 'deleted' };
    if (r.customer?.isDeleted) return { label: 'ADMIN.DELETED_CUSTOMER', cssClass: 'pending' };
    if (r.craftsman?.isDeleted) return { label: 'ADMIN.DELETED_CRAFTSMAN', cssClass: 'pending' };
    return { label: 'ADMIN.ACTIVATED', cssClass: 'approved' };
  }

  showActions(r: any): { delete: boolean } {
    return { delete: !r.isDeleted };
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
}
