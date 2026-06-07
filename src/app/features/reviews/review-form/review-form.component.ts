import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ReviewsService } from '../reviews.service';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './review-form.component.html',
  styleUrls: ['./review-form.component.css'],
})
export class ReviewFormComponent implements OnInit {
  @Input() jobId!: number;

  private reviewsService = inject(ReviewsService);

  form = new FormGroup({
    stars: new FormControl(0, [Validators.required, Validators.min(1), Validators.max(5)]),
    comment: new FormControl('', [Validators.maxLength(1000)]),
  });

  isLoading = false;
  isSubmitted = false; // true → show thank you screen

  hoveredStar = 0;
  starsArray = [1, 2, 3, 4, 5];

  ngOnInit(): void {}

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

    this.isLoading = true;

    this.reviewsService
      .submitReview({
        jobId: this.jobId,
        stars: this.form.value.stars!,
        comment: this.form.value.comment || undefined,
      })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.isSubmitted = true;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  get starsControl() {
    return this.form.get('stars');
  }
  get commentControl() {
    return this.form.get('comment');
  }
}
