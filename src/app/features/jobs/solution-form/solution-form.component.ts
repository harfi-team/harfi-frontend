import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { JobDto } from '../../../core/models/job.models';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-solution-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solution-form.component.html',
  styleUrls: ['./solution-form.component.css'],
})
export class SolutionFormComponent {
  @Input() jobId!: number;
  @Input() job!: JobDto;
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<void>();

  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  solutionSteps = '';
  isLoading = false;
  isSubmitted = false;
  errorMessage = '';
  showValidation = false;

  onSubmit(): void {
    this.showValidation = true;

    if (!this.solutionSteps.trim() || this.solutionSteps.length > 1000) {
      return;
    }

    if (!this.jobId || this.jobId === 0) {
      this.errorMessage = 'رقم الطلب غير صحيح';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const steps = this.solutionSteps
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const payload = {
      userId: this.authService.getUserId() || 0,
        jobId: Number(this.jobId),           // ← أضف السطر ده

      serviceType: this.job?.service || 'صيانة عامة',
      problemDescription: this.job?.problemDescription || this.job?.description || '',
      steps: steps,
      craftsmanId: this.authService.getCraftsmanId() || 0,
    };

    const endpoint = `${environment.apiBaseUrl}/AI/craftsman/check-and-submit-solution`;

    this.http
      .post<{ accepted: boolean; message: string }>(endpoint, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          if (result.accepted) {
            this.isSubmitted = true;
            this.cdr.detectChanges();
            setTimeout(() => {
              this.submitted.emit();
              this.closeModal();
            }, 2000);
          } else {
            this.errorMessage = result.message || 'خطوات الحل اللي دخلتها مش صح، حاول تكون أكثر تفصيلاً.';
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || err.error?.error || 'حدث خطأ، يرجى المحاولة مرة أخرى';
          this.cdr.detectChanges();
        },
      });
  }

  closeModal(): void {
    if (this.isSubmitted) this.isSubmitted = false;
    this.solutionSteps = '';
    this.errorMessage = '';
    this.showValidation = false;
    this.close.emit();
  }
}