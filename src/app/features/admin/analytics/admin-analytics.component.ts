import { Component, inject, signal, computed, AfterViewInit, OnDestroy, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { AdminService } from '../admin.service';
import {
  OverviewStats,
  CraftsmenAnalytics,
  JobsAnalytics,
  ReviewsAnalytics,
  AiAnalytics,
} from '@core/models/admin.models';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

type TabId = 'overview' | 'craftsmen' | 'jobs' | 'reviews' | 'ai';

Chart.defaults.font.family = "'Cairo', sans-serif";

const COLORS = {
  brand: '#E94057',
  purple: '#8A2387',
  orange: '#F27121',
  blue: '#3b82f6',
  green: '#10b981',
  red: '#ef4444',
  yellow: '#f59e0b',
  indigo: '#6366f1',
  pink: '#ec4899',
  teal: '#14b8a6',
};

const CHART_COLORS = [COLORS.brand, COLORS.purple, COLORS.orange, COLORS.blue, COLORS.green, COLORS.yellow, COLORS.indigo, COLORS.pink, COLORS.teal, COLORS.red];

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, DecimalPipe],
  templateUrl: './admin-analytics.component.html',
  styleUrl: './admin-analytics.component.css',
})
export class AdminAnalyticsComponent implements AfterViewInit, OnDestroy {
  private adminService = inject(AdminService);
  private errorHandler = inject(ErrorHandlerService);
  private cdr = inject(ChangeDetectorRef);

  activeTab = signal<TabId>('overview');
  loading = signal(false);
  exporting = signal(false);

  serviceTypes = signal<string[]>([]);
  cities = signal<string[]>([]);

  overviewData = signal<OverviewStats | null>(null);
  craftsmanAnalytics = signal<CraftsmenAnalytics | null>(null);
  jobAnalytics = signal<JobsAnalytics | null>(null);
  reviewAnalytics = signal<ReviewsAnalytics | null>(null);
  aiAnalytics = signal<AiAnalytics | null>(null);

  error = signal<string | null>(null);

  private charts: Chart[] = [];
  private resizeObservers: ResizeObserver[] = [];

  readonly craftsmanStatusChartData = computed(() => {
    const d = this.craftsmanAnalytics();
    if (!d) return null;
    return {
      labels: ['معلق', 'مقبول', 'مرفوض', 'موقوف'],
      datasets: [{
        data: [d.pendingApproval, d.approved, d.rejected, d.suspended],
        backgroundColor: [COLORS.yellow, COLORS.green, COLORS.red, COLORS.orange],
        borderWidth: 0,
      }],
    };
  });

  readonly craftsmanServiceChartData = computed(() => {
    const d = this.craftsmanAnalytics();
    if (!d || !d.byServiceType) return null;
    const entries = Object.entries(d.byServiceType);
    return {
      labels: entries.map(([k]) => k),
      datasets: [{
        data: entries.map(([, v]) => v),
        backgroundColor: entries.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
        borderWidth: 0,
      }],
    };
  });

  readonly craftsmanCityChartData = computed(() => {
    const d = this.craftsmanAnalytics();
    if (!d || !d.byCity) return null;
    const entries = Object.entries(d.byCity);
    return {
      labels: entries.map(([k]) => k),
      datasets: [{
        data: entries.map(([, v]) => v),
        backgroundColor: entries.map((_, i) => CHART_COLORS[(i + 3) % CHART_COLORS.length]),
        borderWidth: 0,
      }],
    };
  });

  readonly jobStatusChartData = computed(() => {
    const d = this.jobAnalytics();
    if (!d) return null;
    return {
      labels: ['مفتوح', 'قيد التنفيذ', 'مكتمل', 'مرفوض', 'نزاع'],
      datasets: [{
        data: [d.open, d.inProgress, d.completed, d.rejected, d.disputed],
        backgroundColor: [COLORS.blue, COLORS.yellow, COLORS.green, COLORS.red, COLORS.purple],
        borderWidth: 0,
      }],
    };
  });

  readonly jobServiceChartData = computed(() => {
    const d = this.jobAnalytics();
    if (!d || !d.byServiceType) return null;
    const entries = Object.entries(d.byServiceType);
    return {
      labels: entries.map(([k]) => k),
      datasets: [{
        data: entries.map(([, v]) => v),
        backgroundColor: entries.map((_, i) => CHART_COLORS[(i + 2) % CHART_COLORS.length]),
        borderWidth: 0,
      }],
    };
  });

  readonly reviewStarChartData = computed(() => {
    const d = this.reviewAnalytics();
    if (!d || !d.starDistribution) return null;
    return {
      labels: ['نجمة', 'نجمتان', '3 نجوم', '4 نجوم', '5 نجوم'],
      datasets: [{
        data: [d.starDistribution['1'] || 0, d.starDistribution['2'] || 0, d.starDistribution['3'] || 0, d.starDistribution['4'] || 0, d.starDistribution['5'] || 0],
        backgroundColor: [COLORS.red, COLORS.orange, COLORS.yellow, COLORS.blue, COLORS.green],
        borderWidth: 0,
      }],
    };
  });

  readonly aiIngestedChartData = computed(() => {
    const d = this.aiAnalytics();
    if (!d) return null;
    return {
      labels: ['حرفيون', 'حلول'],
      datasets: [{
        data: [d.totalCraftsmenIngested, d.totalSolutionsIngested],
        backgroundColor: [COLORS.purple, COLORS.teal],
        borderWidth: 0,
      }],
    };
  });

  constructor() {
    this.loadAll();
    this.adminService.getServiceTypes().subscribe(data =>
      this.serviceTypes.set(data.map(s => s.nameAr))
    );
    this.adminService.getCities().subscribe(data =>
      this.cities.set(data.map(c => c.nameAr))
    );
    effect(() => {
      const tab = this.activeTab();
      setTimeout(() => {
        this.cdr.detectChanges();
        if (tab === 'craftsmen') {
          this.initCraftsmanCharts();
        } else if (tab === 'jobs') {
          this.initJobCharts();
        } else if (tab === 'reviews') {
          this.initReviewChart();
        } else if (tab === 'ai') {
          this.initAiChart();
        }
      }, 50);
    });
  }

  ngAfterViewInit(): void {
    if (this.activeTab() === 'overview') {
      setTimeout(() => this.initOverviewCharts(), 100);
    }
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  private loadAll(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      overview: this.adminService.getOverviewStats(),
      craftsmen: this.adminService.getCraftsmenAnalytics(),
      jobs: this.adminService.getJobsAnalytics(),
      reviews: this.adminService.getReviewsAnalytics(),
      ai: this.adminService.getAiAnalytics(),
    }).subscribe({
      next: (data) => {
        this.overviewData.set(data.overview);
        this.craftsmanAnalytics.set(data.craftsmen);
        this.jobAnalytics.set(data.jobs);
        this.reviewAnalytics.set(data.reviews);
        this.aiAnalytics.set(data.ai);
        this.loading.set(false);
        this.cdr.detectChanges();
        setTimeout(() => this.initCurrentTabCharts(), 0);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'حدث خطأ أثناء تحميل البيانات';
        this.error.set(msg);
        this.errorHandler.error(msg);
      },
    });
  }

  setTab(tab: TabId): void {
    this.activeTab.set(tab);
  }

  async exportData(type: string): Promise<void> {
    this.exporting.set(true);
    this.adminService.exportData(type).subscribe({
      next: async (blob) => {
        const text = await blob.text();
        const BOM = '\uFEFF';
        const newBlob = new Blob([BOM + text], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(newBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `harfi-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
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

  private destroyCharts(): void {
    for (const c of this.charts) c.destroy();
    this.charts = [];
    for (const r of this.resizeObservers) r.disconnect();
    this.resizeObservers = [];
  }

  private createChart(canvasId: string, config: any): void {
    this.charts = this.charts.filter(c => {
      if (c?.canvas?.id === canvasId) {
        c.destroy();
        return false;
      }
      return true;
    });

    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (parent && parent.offsetWidth === 0) {
      const ro = new ResizeObserver(() => {
        if (parent.offsetWidth > 0) {
          ro.disconnect();
          this.initCanvasChart(canvas, config);
        }
      });
      ro.observe(parent);
      this.resizeObservers.push(ro);
      return;
    }

    this.initCanvasChart(canvas, config);
  }

  private initCanvasChart(canvas: HTMLCanvasElement, config: any): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const chart = new Chart(ctx, config);
    this.charts.push(chart);
  }

  private initCraftsmanCharts(): void {
    const statusData = this.craftsmanStatusChartData();
    if (statusData) {
      this.createChart('craftsmanStatusChart', {
        type: 'doughnut',
        data: statusData,
        options: {
          responsive: true,
          maintainAspectRatio: true,
          rtl: true,
          plugins: {
            legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 16, usePointStyle: true } },
          },
        },
      });
    }

    const serviceData = this.craftsmanServiceChartData();
    if (serviceData) {
      this.createChart('craftsmanServiceChart', {
        type: 'bar',
        data: serviceData,
        options: {
          indexAxis: 'y',
          rtl: true,
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: { beginAtZero: true, ticks: { stepSize: 1 } },
            y: { ticks: { font: { size: 11 } } },
          },
        },
      });
    }

    const cityData = this.craftsmanCityChartData();
    if (cityData) {
      this.createChart('craftsmanCityChart', {
        type: 'bar',
        data: cityData,
        options: {
          responsive: true,
          maintainAspectRatio: true,
          rtl: true,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
            x: { ticks: { font: { size: 10 }, maxRotation: 45 } },
          },
        },
      });
    }
  }

  private initJobCharts(): void {
    const jobStatusData = this.jobStatusChartData();
    if (jobStatusData) {
      this.createChart('jobStatusChart', {
        type: 'doughnut',
        data: jobStatusData,
        options: {
          responsive: true,
          maintainAspectRatio: true,
          rtl: true,
          plugins: {
            legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 16, usePointStyle: true } },
          },
        },
      });
    }

    const jobServiceData = this.jobServiceChartData();
    if (jobServiceData) {
      this.createChart('jobServiceChart', {
        type: 'bar',
        data: jobServiceData,
        options: {
          indexAxis: 'y',
          rtl: true,
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: { beginAtZero: true, ticks: { stepSize: 1 } },
            y: { ticks: { font: { size: 11 } } },
          },
        },
      });
    }
  }

  private initReviewChart(): void {
    const starData = this.reviewStarChartData();
    if (starData) {
      this.createChart('reviewStarChart', {
        type: 'bar',
        data: starData,
        options: {
          rtl: true,
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
            x: { ticks: { font: { size: 11 } } },
          },
        },
      });
    }
  }

  private initAiChart(): void {
    const ingestedData = this.aiIngestedChartData();
    if (ingestedData) {
      this.createChart('aiIngestedChart', {
        type: 'bar',
        data: ingestedData,
        options: {
          rtl: true,
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
            x: { ticks: { font: { size: 12 } } },
          },
        },
      });
    }
  }

  private initCurrentTabCharts(): void {
    const tab = this.activeTab();
    if (tab === 'craftsmen') {
      this.initCraftsmanCharts();
    } else if (tab === 'jobs') {
      this.initJobCharts();
    } else if (tab === 'reviews') {
      this.initReviewChart();
    } else if (tab === 'ai') {
      this.initAiChart();
    }
  }

  private initOverviewCharts(): void {
  }

  protected readonly COLORS = COLORS;
  protected readonly CHART_COLORS = CHART_COLORS;
}
