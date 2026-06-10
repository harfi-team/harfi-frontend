import { Component, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService } from '../admin.service';
import { OverviewStats, PendingCraftsman, AdminJob, JobsAnalytics } from '@core/models/admin.models';
import { JobIdPipe } from '@shared/pipes/job-id.pipe';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, DecimalPipe, JobIdPipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent {
  private adminService = inject(AdminService);

  stats = signal<OverviewStats | null>(null);
  pendingCraftsmen = signal<PendingCraftsman[]>([]);
  latestJobs = signal<AdminJob[]>([]);
  jobsAnalytics = signal<JobsAnalytics | null>(null);
  loading = signal(true);

  constructor() {
    this.adminService.getOverviewStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.adminService.getPendingCraftsmen(1, 2).subscribe({
      next: (data) => this.pendingCraftsmen.set(data.items),
      error: () => {},
    });

    this.adminService.getJobs(undefined, undefined, undefined, undefined, undefined, 1, 2).subscribe({
      next: (data) => this.latestJobs.set(data.items),
      error: () => {},
    });

    this.adminService.getJobsAnalytics().subscribe({
      next: (data) => this.jobsAnalytics.set(data),
      error: () => {},
    });
  }

  getServiceDistribution(jobAnalytics: JobsAnalytics | null): { label: string; pct: number; color: string }[] {
    if (!jobAnalytics) return [];
    const colors = ['#E94057', '#8A2387', '#F27121', '#3B82F6', '#10B981'];
    const total = Object.values(jobAnalytics.byServiceType).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(jobAnalytics.byServiceType).map(([label, count], i) => ({
      label,
      pct: Math.round((count / total) * 100),
      color: colors[i % colors.length],
    }));
  }

  getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      'open': 'open',
      'in-progress': 'in-progress',
      'completed': 'done',
      'rejected': 'rejected',
      'cancelled': 'rejected',
      'disputed': 'rejected',
      'in_progress': 'in-progress',
    };
    return map[status] || 'open';
  }
}
