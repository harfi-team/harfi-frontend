import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DisputeService } from './dispute.service';
import { AuthService } from '../../core/services/auth.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { DisputeDetailDto } from '../../core/models/dispute.models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dispute-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dispute-dialog.component.html',
  styleUrls: ['./dispute-dialog.component.css'],
})
export class DisputeDialogComponent {
  visible = input(false);
  jobId = input<string>('');
  mode = input<'create' | 'view'>('create');

  close = output<void>();
  disputeCreated = output<void>();
  respondRequested = output<number>();

  private disputeService = inject(DisputeService);
  private authService = inject(AuthService);
  private errorHandler = inject(ErrorHandlerService);

  dispute = signal<DisputeDetailDto | null>(null);
  loading = signal(false);
  submitting = signal(false);
  errorMessage = '';
  showValidation = false;

  reason = '';
  description = '';
  attachments: string[] = [];
  uploadQueue: File[] = [];
  uploadPreviews: string[] = [];
  uploading = signal(false);

  get isRaiser(): boolean {
    const d = this.dispute();
    if (!d) return false;
    return d.raisedByUserId === Number(this.authService.getUserId());
  }

  get canRespond(): boolean {
    const d = this.dispute();
    if (!d) return false;
    return !this.isRaiser && d.status === 'قيد المراجعة';
  }

  get canCreate(): boolean {
    return this.mode() === 'create' && !this.loading();
  }

  get serverBase(): string {
    return environment.apiBaseUrl.replace('/api', '');
  }

  onVisibleChange(): void {
    if (this.visible() && this.mode() === 'view') {
      this.loadDispute();
    }
  }

  private loadDispute(): void {
    const id = this.jobId();
    if (!id) return;
    this.loading.set(true);
    this.disputeService.getDisputeByJob(id).subscribe({
      next: (d) => {
        this.dispute.set(d);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage = 'حدث خطأ أثناء تحميل بيانات النزاع';
        this.loading.set(false);
      },
    });
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    for (const file of Array.from(input.files)) {
      if (!file.type.startsWith('image/')) continue;
      this.uploadQueue.push(file);
      const reader = new FileReader();
      reader.onload = () => {
        this.uploadPreviews.push(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  removeFile(index: number): void {
    this.uploadQueue.splice(index, 1);
    this.uploadPreviews.splice(index, 1);
  }

  private uploadAll(): Promise<string[]> {
    if (this.uploadQueue.length === 0) return Promise.resolve([]);
    this.uploading.set(true);
    const uploads = this.uploadQueue.map((file) =>
      this.disputeService.uploadDisputeImage(file).toPromise()
    );
    return Promise.all(uploads).then(
      (results) => results.map((r) => r!.url),
      (err) => {
        this.errorMessage = 'فشل رفع الصور، حاول مرة أخرى';
        throw err;
      }
    ).finally(() => this.uploading.set(false));
  }

  onCreateSubmit(): void {
    this.showValidation = true;
    this.errorMessage = '';

    if (!this.reason.trim() || this.reason.trim().length < 10) return;
    if (this.reason.length > 500) return;

    this.submitting.set(true);
    this.uploadAll().then((urls) => {
      this.attachments = urls;
      const payload: any = { reason: this.reason.trim() };
      if (this.description.trim()) payload.description = this.description.trim();
      if (this.attachments.length > 0) payload.attachments = JSON.stringify(this.attachments);

      this.disputeService.createDispute(this.jobId(), payload).subscribe({
        next: () => {
          this.submitting.set(false);
          this.resetForm();
          this.disputeCreated.emit();
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage = err.error?.message || err.error?.error || 'حدث خطأ، حاول مرة أخرى';
        },
      });
    }).catch(() => {
      this.submitting.set(false);
    });
  }

  onRespond(): void {
    const d = this.dispute();
    if (d) this.respondRequested.emit(d.id);
  }

  closeModal(): void {
    this.resetForm();
    this.close.emit();
  }

  private resetForm(): void {
    this.reason = '';
    this.description = '';
    this.attachments = [];
    this.uploadQueue = [];
    this.uploadPreviews = [];
    this.errorMessage = '';
    this.showValidation = false;
    this.submitting.set(false);
    this.loading.set(false);
  }

  parseAttachments(json: string | null): string[] {
    if (!json) return [];
    try { return JSON.parse(json); } catch { return []; }
  }
}
