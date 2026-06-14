import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { JobAction, JobDto } from '../../../core/models/job.models';
import { JobsService } from '../jobs.service';
import { environment } from '../../../../environments/environment';
import { ReviewsService } from '../../reviews/reviews.service';
import { ReviewFormComponent } from '../../reviews/review-form/review-form.component';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    DatePipe,
    ReviewFormComponent,
  ],
  templateUrl: './job-detail.component.html',
  styleUrl: './job-detail.component.css',
})
export class JobDetailComponent implements OnInit {
  private jobsService = inject(JobsService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private errorHandler = inject(ErrorHandlerService);
  private reviewsService = inject(ReviewsService);
  private translate = inject(TranslateService);

  job = signal<JobDto | null>(null);
  loading = signal(true);

  readonly starsArray = [1, 2, 3, 4, 5];
  stars = signal(0);
  hoveredStar = signal(0);
  comment = signal('');
  reviewSubmitting = signal(false);
  reviewSubmitted = signal(false);
  reviewError = signal('');

  readonly isCustomer = computed(() => this.authService.getRole() === 'customer');
  readonly isCraftsman = computed(() => this.authService.getRole() === 'craftsman');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/jobs']);
      return;
    }
    this.loadJob(id);
  }

  private loadJob(id: string): void {
    this.loading.set(true);
    this.jobsService.getJobById(id).subscribe({
      next: (data) => {
        this.job.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.errorHandler.error('Failed to load job details');
        this.loading.set(false);
        this.router.navigate(['/jobs']);
      },
    });
  }

  performAction(action: JobAction): void {
    const j = this.job();
    if (!j) return;
    this.jobsService.performAction(j.id, action).subscribe({
      next: () => {
        const key =
          action === 'accept'
            ? 'JOBS.SUCCESS_ACCEPTED'
            : action === 'reject'
              ? 'JOBS.SUCCESS_REJECTED'
              : 'JOBS.SUCCESS_COMPLETED';
        this.errorHandler.success(this.translate.instant(key));
        this.loadJob(j.id);
      },
      error: (err) => this.errorHandler.handle(err),
    });
  }

  canAccept(): boolean {
    return this.isCraftsman() && this.job()?.status === 'open';
  }

  canReject(): boolean {
    return this.isCraftsman() && this.job()?.status === 'open';
  }

  canComplete(): boolean {
    return this.isCraftsman() && this.job()?.status === 'in-progress';
  }

  canOpenChat(): boolean {
    const j = this.job();
    return !!j?.conversationId && j?.status === 'in-progress';
  }

  openChat(): void {
    const j = this.job();
    if (j?.conversationId) {
      this.router.navigate(['/chat', j.conversationId]);
    }
  }

  readonly canReview = computed(() => {
    const j = this.job();
    return this.isCustomer() && j?.status === 'done' && !this.reviewSubmitted();
  });

  selectStar(star: number): void {
    this.stars.set(star);
  }

  hoverStar(star: number): void {
    this.hoveredStar.set(star);
  }

  resetHover(): void {
    this.hoveredStar.set(0);
  }

  isStarActive(star: number): boolean {
    const active = this.hoveredStar() || this.stars();
    return star <= active;
  }

  submitReview(): void {
    const j = this.job();
    if (!j || this.stars() < 1 || this.reviewSubmitting()) return;

    this.reviewSubmitting.set(true);
    this.reviewError.set('');

    this.reviewsService
      .submitReview({
        jobId: Number(j.id),
        stars: this.stars(),
        comment: this.comment() || undefined,
      })
      .subscribe({
        next: () => {
          this.reviewSubmitted.set(true);
          this.reviewSubmitting.set(false);
        },
        error: (err) => {
          this.reviewError.set(err?.error?.message || err?.message || '');
          this.reviewSubmitting.set(false);
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/jobs']);
  }

  getStatusClass(status: string | undefined): string {
    const map: Record<string, string> = {
      open: 'open',
      'in-progress': 'in-progress',
      done: 'done',
      rejected: 'rejected',
    };
    return map[status || ''] || 'open';
  }

  getStatusLabelKey(status: string | undefined): string {
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
        return '';
    }
  }

  getServiceIcon(service: string): string {
    if (!service) return 'handyman';
    const iconMap: Record<string, string> = {
      plumbing: 'plumbing',
      electrical: 'electrical_services',
      carpentry: 'carpenter',
      painting: 'format_paint',
      ac: 'ac_unit',
      cleaning: 'cleaning_services',
      moving: 'local_shipping',
      pest: 'pest_control',
      roofing: 'roofing',
      سباك: 'plumbing',
      كهربائي: 'electrical_services',
      نجار: 'carpenter',
      نقاش: 'format_paint',
      تكييف: 'ac_unit',
      نظافة: 'cleaning_services',
      نقل: 'local_shipping',
      'مكافحة حشرات': 'pest_control',
    };
    return iconMap[service.toLowerCase()] ?? iconMap[service] ?? 'handyman';
  }

  getImageUrl(path: string): string {
    const serverBase = environment.apiBaseUrl.replace('/api', '');
    return `${serverBase}${path}`;
  }
  jobId(): number {
    return this.job()?.id ? Number(this.job()?.id) : 0;
  }
}
