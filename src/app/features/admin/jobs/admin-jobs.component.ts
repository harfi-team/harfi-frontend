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

  allJobs = signal<AdminJob[]>([]);
  jobsAnalytics = signal<JobsAnalytics | null>(null);
  loading = signal(true);
  activeTab = signal<JobFilterTab>('all');

  statusFilter = signal('');
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
    this.adminService.getJobs(undefined, undefined, undefined, undefined, undefined, 1, 200).subscribe({
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
    if (tab !== 'all') return items.filter(j => j.status === tab);
    return items;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'open': 'open',
      'in-progress': 'in-progress',
      'in_progress': 'in-progress',
      'completed': 'done',
      'rejected': 'rejected',
      'cancelled': 'rejected',
      'disputed': 'rejected',
    };
    return map[status] || 'open';
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'open': return 'OPEN';
      case 'in-progress': case 'in_progress': return 'ADMIN.IN_PROGRESS';
      case 'completed': return 'ADMIN.COMPLETED';
      case 'rejected': return 'ADMIN.REJECTED_STATUS';
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

  exportJobs(): void {
    this.adminService.exportData('jobs').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jobs-export-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.errorHandler.success('تم تصدير الطلبات');
      },
    });
  }

  applyFilter(): void {
    this.loading.set(true);
    this.adminService.getJobs(
      this.statusFilter() || undefined,
      undefined,
      undefined,
      this.fromDate() || undefined,
      this.toDate() || undefined,
      1, 200
    ).subscribe({
      next: (data) => {
        this.allJobs.set(data.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  viewJob(id: number): void {
    this.router.navigate(['/admin/jobs', id]);
  }
}
