import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ReviewsService } from '../reviews.service';
import { JobDto } from '../../../core/models/job.models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './review-form.component.html',
  styleUrls: ['./review-form.component.css'],
})
export class ReviewFormComponent implements OnInit {
  @Input() jobId!: number;
  @Input() job!: JobDto;
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();

  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private reviewsService = inject(ReviewsService);

  form = new FormGroup({
    stars: new FormControl(0, [Validators.required, Validators.min(1), Validators.max(5)]),
    comment: new FormControl('', [Validators.maxLength(1000)]),
  });

  isLoading = false;
  isSubmitted = false; // true → show thank you screen
  errorMessage = ''; // Arabic error from backend
  alreadyReviewed = false; // ← frontend check

  hoveredStar = 0;
  starsArray = [1, 2, 3, 4, 5];

  ngOnInit(): void {
    // ✅ Frontend check من الـ localStorage
    const reviewedJobs = JSON.parse(localStorage.getItem('reviewedJobs') || '[]');
    if (reviewedJobs.includes(this.jobId)) {
      this.alreadyReviewed = true;
    }
  }

  selectStar(star: number): void {
    this.form.get('stars')?.setValue(star);
  }

  hoverStar(star: number): void {
    this.hoveredStar = star;
  }

  resetHover(): void {
    this.hoveredStar = 0;
  }

  isStarActive(star: number): boolean {
    const active = this.hoveredStar || this.form.get('stars')?.value || 0;
    return star <= active;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // ✅ تأكد إن الـ jobId صح قبل الإرسال
    if (!this.jobId || this.jobId === 0) {
      this.errorMessage = 'رقم الطلب غير صحيح';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.form.disable();

    this.reviewsService
      .submitReview({
        jobId: Number(this.jobId),
        stars: this.form.value.stars!,
        comment: this.form.value.comment || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const reviewedJobs = JSON.parse(localStorage.getItem('reviewedJobs') || '[]');
          if (!reviewedJobs.includes(this.jobId)) {
            reviewedJobs.push(this.jobId);
            localStorage.setItem('reviewedJobs', JSON.stringify(reviewedJobs));
          }

          this.isLoading = false;
          this.isSubmitted = true;
          this.cdr.detectChanges();
          setTimeout(() => this.closeModal(), 2000);
        },
        error: (err) => {
          this.isLoading = false;
          if (err.status === 500) {
            const reviewedJobs = JSON.parse(localStorage.getItem('reviewedJobs') || '[]');
            if (!reviewedJobs.includes(this.jobId)) {
              reviewedJobs.push(this.jobId);
              localStorage.setItem('reviewedJobs', JSON.stringify(reviewedJobs));
            }
            this.isSubmitted = true;
          } else {
            this.errorMessage = err.error?.message || 'حدث خطأ، يرجى المحاولة مرة أخرى';
            this.form.enable();
          }

          this.cdr.detectChanges();
        },
      });
  }

  // ── Avatar helper ─────────────────────────────────────────────────
  getInitial(name: string | undefined): string {
    return (name || '?').charAt(0);
  }
  closeModal(): void {
    if (this.isSubmitted) {
      this.isSubmitted = false;
    }
    this.form.reset({ stars: 0, comment: '' });
    this.errorMessage = '';
    this.close.emit();
  }

  get starsControl() {
    return this.form.get('stars');
  }
  get commentControl() {
    return this.form.get('comment');
  }
}
