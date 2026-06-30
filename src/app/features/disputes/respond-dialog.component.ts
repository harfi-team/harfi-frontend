import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DisputeService } from './dispute.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';

@Component({
  selector: 'app-respond-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './respond-dialog.component.html',
  styleUrls: ['./respond-dialog.component.css'],
})
export class RespondDialogComponent {
  visible = input(false);
  disputeId = input<number>(0);

  close = output<void>();
  responded = output<void>();

  private disputeService = inject(DisputeService);
  private errorHandler = inject(ErrorHandlerService);

  message = '';
  uploadQueue: File[] = [];
  uploadPreviews: string[] = [];
  submitting = signal(false);
  uploading = signal(false);
  errorMessage = '';
  showValidation = false;

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
      () => {
        this.errorMessage = 'فشل رفع الصور، حاول مرة أخرى';
        throw new Error('upload failed');
      }
    ).finally(() => this.uploading.set(false));
  }

  onSubmit(): void {
    this.showValidation = true;
    this.errorMessage = '';

    if (!this.message.trim() || this.message.trim().length < 10) return;
    if (this.message.length > 2000) return;

    this.submitting.set(true);
    this.uploadAll().then((urls) => {
      const payload: any = { message: this.message.trim() };
      if (urls.length > 0) payload.attachments = JSON.stringify(urls);

      this.disputeService.respondToDispute(this.disputeId(), payload).subscribe({
        next: () => {
          this.submitting.set(false);
          this.resetForm();
          this.responded.emit();
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

  closeModal(): void {
    this.resetForm();
    this.close.emit();
  }

  private resetForm(): void {
    this.message = '';
    this.uploadQueue = [];
    this.uploadPreviews = [];
    this.errorMessage = '';
    this.showValidation = false;
    this.submitting.set(false);
  }
}
