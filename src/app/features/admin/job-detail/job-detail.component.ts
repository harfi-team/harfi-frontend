import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService } from '../admin.service';
import { AdminJobDetail } from '@core/models/admin.models';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, DatePipe],
  templateUrl: './job-detail.component.html',
  styleUrl: './job-detail.component.css',
})
export class JobDetailComponent {
  private adminService = inject(AdminService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  job = signal<AdminJobDetail | null>(null);
  chatMetadata = signal<any | null>(null);
  chatMessages = signal<any[]>([]);
  loading = signal(true);
  loadingChat = signal(false);
  error = signal(false);
  showChat = signal(false);

  statusDialogVisible = signal(false);
  newStatus = signal('');
  statusJustification = signal('');

  flagDialogVisible = signal(false);
  flagReason = signal('');

  resolveDialogVisible = signal(false);
  resolution = signal('');
  favoredParty = signal('customer');

  submitted = signal(false);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(id)) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }
    this.loadJob(id);
  }

  loadJob(id: number): void {
    this.loading.set(true);
    this.adminService.getJobById(id).subscribe({
      next: (data) => {
        this.job.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  loadChat(id: number): void {
    if (this.showChat()) {
      this.showChat.set(false);
      return;
    }
    this.showChat.set(true);
    this.loadingChat.set(true);
    this.adminService.getJobChatMetadata(id).subscribe({
      next: (meta) => {
        this.chatMetadata.set(meta);
      },
    });
    this.adminService.getJobChatMessages(id).subscribe({
      next: (msgs) => {
        this.chatMessages.set(msgs);
        this.loadingChat.set(false);
      },
      error: () => this.loadingChat.set(false),
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/jobs']);
  }

  getStatusClass(status: string | undefined): string {
    const map: Record<string, string> = {
      'open': 'open',
      'in-progress': 'in-progress',
      'in_progress': 'in-progress',
      'completed': 'done',
      'rejected': 'rejected',
      'cancelled': 'rejected',
      'disputed': 'rejected',
    };
    return map[status || ''] || 'open';
  }

  getStatusLabel(status: string | undefined): string {
    switch (status) {
      case 'open': return 'OPEN';
      case 'in-progress': case 'in_progress': return 'ADMIN.IN_PROGRESS';
      case 'completed': return 'ADMIN.COMPLETED';
      case 'rejected': case 'cancelled': return 'ADMIN.REJECTED_STATUS';
      case 'disputed': return 'ADMIN.DISPUTED';
      default: return status || '';
    }
  }

  openStatusDialog(): void {
    this.newStatus.set('');
    this.statusJustification.set('');
    this.statusDialogVisible.set(true);
  }

  confirmStatusUpdate(): void {
    const job = this.job();
    if (!job || !this.newStatus() || !this.statusJustification().trim()) return;
    this.submitted.set(true);
    this.adminService.updateJobStatus(job.id, this.newStatus(), this.statusJustification()).subscribe({
      next: (res) => {
        this.errorHandler.success(res.message || 'تم تحديث حالة الوظيفة');
        this.statusDialogVisible.set(false);
        this.submitted.set(false);
        this.loadJob(job.id);
      },
      error: () => this.submitted.set(false),
    });
  }

  openFlagDialog(): void {
    this.flagReason.set('');
    this.flagDialogVisible.set(true);
  }

  confirmFlagDispute(): void {
    const job = this.job();
    if (!job || !this.flagReason().trim()) return;
    this.submitted.set(true);
    this.adminService.flagDispute(job.id, this.flagReason()).subscribe({
      next: (res) => {
        this.errorHandler.success(res.message || 'تم رفع النزاع');
        this.flagDialogVisible.set(false);
        this.submitted.set(false);
        this.loadJob(job.id);
      },
      error: () => this.submitted.set(false),
    });
  }

  openResolveDialog(): void {
    this.resolution.set('');
    this.favoredParty.set('customer');
    this.resolveDialogVisible.set(true);
  }

  confirmResolveDispute(): void {
    const job = this.job();
    if (!job || !this.resolution().trim()) return;
    this.submitted.set(true);
    this.adminService.resolveDispute(job.id, this.resolution(), this.favoredParty()).subscribe({
      next: (res) => {
        this.errorHandler.success(res.message || 'تم حل النزاع');
        this.resolveDialogVisible.set(false);
        this.submitted.set(false);
        this.loadJob(job.id);
      },
      error: () => this.submitted.set(false),
    });
  }

  parseAddress(address: string): string {
    if (!address) return '-';
    return address;
  }
}
