import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService } from '../admin.service';
import { AdminJob, JobsAnalytics } from '@core/models/admin.models';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { JobIdPipe } from '@shared/pipes/job-id.pipe';


type JobFilterTab = 'all' | 'open' | 'in-progress' | 'completed' | 'disputed';

@Component({
  selector: 'app-admin-jobs',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule, DecimalPipe, JobIdPipe],
  templateUrl: './admin-jobs.component.html',
  styleUrl: './admin-jobs.component.css',
})
export class AdminJobsComponent {
  private adminService = inject(AdminService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);

  /** Maps API status values (Arabic or English) to internal filter keys */
  private statusToKey: Record<string, string> = {
    'مفتوح': 'open',
    'قيد التنفيذ': 'in-progress',
    'مكتمل': 'completed',
    'مكتملة': 'completed',
    'مرفوض': 'rejected',
    'ملغي': 'cancelled',
    'متنازع عليه': 'disputed',
    'open': 'open',
    'in_progress': 'in-progress',
    'in-progress': 'in-progress',
    'completed': 'completed',
    'done': 'completed',
    'Done': 'completed',
    'rejected': 'rejected',
    'cancelled': 'cancelled',
    'disputed': 'disputed',
  };

  allJobs = signal<AdminJob[]>([]);
  jobsAnalytics = signal<JobsAnalytics | null>(null);
  loading = signal(true);
  activeTab = signal<JobFilterTab>('all');

  fromDate = signal('');
  toDate = signal('');

  dialogVisible = signal(false);
  selectedJobId = signal<number>(0);
  resolution = signal('');
  favoredParty = signal('customer');

  constructor() {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.adminService.getJobs(undefined, undefined, undefined, this.fromDate() || undefined, this.toDate() || undefined, 1, 200).subscribe({
      next: (data) => {
        this.allJobs.set(data.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.adminService.getJobsAnalytics().subscribe({
      next: (data) => this.jobsAnalytics.set(data),
    });
  }

  get filteredJobs(): AdminJob[] {
    let items = this.allJobs();
    const tab = this.activeTab();
    if (tab === 'disputed') return items.filter(j => j.isDisputed);
    if (tab !== 'all') return items.filter(j => this.statusToKey[j.status] === tab);
    return items;
  }

  getStatusClass(status: string): string {
    const key = this.statusToKey[status] || status;
    const map: Record<string, string> = {
      'open': 'open',
      'in-progress': 'in-progress',
      'in_progress': 'in-progress',
      'completed': 'done',
      'rejected': 'rejected',
      'cancelled': 'cancelled',
      'disputed': 'disputed',
    };
    return map[key] || 'open';
  }

  getStatusLabel(status: string): string {
    const key = this.statusToKey[status] || status;
    switch (key) {
      case 'open': return 'OPEN';
      case 'in-progress': case 'in_progress': return 'ADMIN.IN_PROGRESS';
      case 'completed': return 'ADMIN.COMPLETED';
      case 'rejected': return 'ADMIN.REJECTED_STATUS';
      case 'cancelled': return 'ADMIN.CANCELLED';
      case 'disputed': return 'ADMIN.DISPUTED';
      default: return status;
    }
  }

  get disputedCount(): number {
    return this.allJobs().filter(j => j.isDisputed).length;
  }

  parseCity(address: string): string {
    if (!address) return '-';
    const parts = address.split(',');
    return parts[parts.length - 1].trim();
  }

  setTab(tab: JobFilterTab): void {
    this.activeTab.set(tab);
  }

  openResolveDialog(jobId: number): void {
    this.selectedJobId.set(jobId);
    this.dialogVisible.set(true);
    this.resolution.set('');
    this.favoredParty.set('customer');
  }

  onResolveConfirmed(): void {
    this.dialogVisible.set(false);
  }

  resolveDispute(): void {
    if (!this.resolution().trim() || !this.selectedJobId()) return;
    this.adminService.resolveDispute(this.selectedJobId(), this.resolution(), this.favoredParty()).subscribe({
      next: (res) => {
        this.errorHandler.success(res.message || 'تم حل النزاع');
        this.dialogVisible.set(false);
        this.loadData();
      },
      error: () => this.dialogVisible.set(false),
    });
  }

  async exportJobs(): Promise<void> {
    this.adminService.exportData('jobs').subscribe({
      next: async (blob) => {
        const text = await blob.text();
        const BOM = '\uFEFF';
        const newBlob = new Blob([BOM + text], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(newBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jobs-export-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.errorHandler.success('تم تصدير الطلبات');
      },
    });
  }

  onDateChange(): void {
    this.loadData();
  }

  viewJob(id: number): void {
    this.router.navigate(['/admin/jobs', id]);
  }
}
