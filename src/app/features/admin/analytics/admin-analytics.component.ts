import { Component, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService } from '../admin.service';
import {
  OverviewStats,
  CraftsmenAnalytics,
  JobsAnalytics,
  ReviewsAnalytics,
} from '@core/models/admin.models';
import { ErrorHandlerService } from '@core/services/error-handler.service';

type TabId = 'overview' | 'craftsmen' | 'jobs' | 'reviews';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, TranslateModule, DecimalPipe],
  templateUrl: './admin-analytics.component.html',
  styleUrl: './admin-analytics.component.css',
})
export class AdminAnalyticsComponent {
  private adminService = inject(AdminService);
  private errorHandler = inject(ErrorHandlerService);

  activeTab = signal<TabId>('overview');

  overview = signal<OverviewStats | null>(null);
  craftsmen = signal<CraftsmenAnalytics | null>(null);
  jobs = signal<JobsAnalytics | null>(null);
  reviews = signal<ReviewsAnalytics | null>(null);

  loadingOverview = signal(true);
  loadingCraftsmen = signal(false);
  loadingJobs = signal(false);
  loadingReviews = signal(false);
  exporting = signal(false);

  private colors = ['#E94057', '#8A2387', '#F27121', '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];

  constructor() {
    this.loadOverview();
  }

  private loadOverview(): void {
    this.loadingOverview.set(true);
    this.adminService.getOverviewStats().subscribe({
      next: (data) => { this.overview.set(data); this.loadingOverview.set(false); },
      error: () => this.loadingOverview.set(false),
    });
  }

  private loadCraftsmen(): void {
    if (this.craftsmen()) return;
    this.loadingCraftsmen.set(true);
    this.adminService.getCraftsmenAnalytics().subscribe({
      next: (data) => { this.craftsmen.set(data); this.loadingCraftsmen.set(false); },
      error: () => this.loadingCraftsmen.set(false),
    });
  }

  private loadJobs(): void {
    if (this.jobs()) return;
    this.loadingJobs.set(true);
    this.adminService.getJobsAnalytics().subscribe({
      next: (data) => { this.jobs.set(data); this.loadingJobs.set(false); },
      error: () => this.loadingJobs.set(false),
    });
  }

  private loadReviews(): void {
    if (this.reviews()) return;
    this.loadingReviews.set(true);
    this.adminService.getReviewsAnalytics().subscribe({
      next: (data) => { this.reviews.set(data); this.loadingReviews.set(false); },
      error: () => this.loadingReviews.set(false),
    });
  }

  setTab(tab: TabId): void {
    this.activeTab.set(tab);
    if (tab === 'craftsmen' && !this.craftsmen()) this.loadCraftsmen();
    if (tab === 'jobs' && !this.jobs()) this.loadJobs();
    if (tab === 'reviews' && !this.reviews()) this.loadReviews();
  }

  exportData(type: string): void {
    this.exporting.set(true);
    this.adminService.exportData(type).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.exporting.set(false);
        this.errorHandler.success('تم تصدير البيانات بنجاح');
      },
      error: () => this.exporting.set(false),
    });
  }

  starDisplay(rating: number): string[] {
    const r = rating ?? 0;
    const full = Math.floor(r);
    const half = r - full >= 0.5;
    const stars: string[] = [];
    for (let i = 0; i < full; i++) stars.push('star');
    if (half) stars.push('star_half');
    while (stars.length < 5) stars.push('star_outline');
    return stars;
  }

  sumValues(map: Record<string, number> | null | undefined): number {
    return map ? Object.values(map).reduce((a, b) => a + b, 0) : 0;
  }

  donutSegments(map: Record<string, number> | null | undefined): { label: string; value: number; color: string; offset: number; ratio: number }[] {
    if (!map) return [];
    const total = this.sumValues(map);
    const entries = Object.entries(map);
    const circumference = 2 * Math.PI * 45;
    let offset = 0;
    return entries.map(([label, value], i) => {
      const ratio = total > 0 ? value / total : 0;
      const length = ratio * circumference;
      const seg = { label, value, color: this.colors[i % this.colors.length], offset, ratio };
      offset -= length;
      return seg;
    });
  }

  jobStatuses(): { key: string; label: string; value: number; color: string }[] {
    const j = this.jobs();
    if (!j) return [];
    return [
      { key: 'open', label: 'ADMIN.OPEN', value: j.open, color: '#3b82f6' },
      { key: 'inProgress', label: 'ADMIN.IN_PROGRESS', value: j.inProgress, color: '#f59e0b' },
      { key: 'completed', label: 'ADMIN.COMPLETED', value: j.completed, color: '#10b981' },
      { key: 'rejected', label: 'ADMIN.REJECTED', value: j.rejected, color: '#ef4444' },
      { key: 'disputed', label: 'ADMIN.DISPUTED', value: j.disputed, color: '#8B5CF6' },
    ];
  }

  maxJobStatus(): number {
    return Math.max(...this.jobStatuses().map(s => s.value), 1);
  }

  starBars(): { stars: string; count: number; color: string }[] {
    const r = this.reviews();
    if (!r) return [];
    const maxCount = Math.max(...Object.values(r.starDistribution), 1);
    return ['5', '4', '3', '2', '1'].map((key, i) => ({
      stars: key,
      count: r.starDistribution[key] || 0,
      color: this.colors[i],
    }));
  }

  maxStarCount(): number {
    return Math.max(...this.starBars().map(b => b.count), 1);
  }
}
