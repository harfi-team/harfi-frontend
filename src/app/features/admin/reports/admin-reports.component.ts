import { Component, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService } from '../admin.service';
import { AdminReport } from '@core/models/admin.models';
import { ErrorHandlerService } from '@core/services/error-handler.service';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, DecimalPipe],
  templateUrl: './admin-reports.component.html',
  styleUrl: './admin-reports.component.css',
})
export class AdminReportsComponent {
  private adminService = inject(AdminService);
  private errorHandler = inject(ErrorHandlerService);

  reports = signal<AdminReport[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  pageSize = 20;

  statusFilter = signal<string>('');
  typeFilter = signal<string>('');

  viewReport = signal<AdminReport | null>(null);
  resolveReportData = signal<AdminReport | null>(null);
  resolveAction = signal('');
  resolveNotes = signal('');
  resolving = signal(false);

  constructor() {
    this.loadReports();
  }

  loadReports(): void {
    this.loading.set(true);
    this.adminService.getReports(
      this.statusFilter() || undefined,
      this.typeFilter() || undefined,
      this.page(),
      this.pageSize,
    ).subscribe({
      next: (data) => {
        this.reports.set(data.items);
        this.total.set(data.totalCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFilterChange(): void {
    this.page.set(1);
    this.loadReports();
  }

  changePage(p: number): void {
    this.page.set(p);
    this.loadReports();
  }

  openView(report: AdminReport): void {
    this.viewReport.set(report);
  }

  closeView(): void {
    this.viewReport.set(null);
  }

  openResolve(report: AdminReport): void {
    this.resolveReportData.set(report);
    this.resolveAction.set('');
    this.resolveNotes.set('');
  }

  closeResolve(): void {
    this.resolveReportData.set(null);
  }

  confirmResolve(): void {
    const report = this.resolveReportData();
    const action = this.resolveAction().trim();
    const notes = this.resolveNotes().trim();
    if (!report || !action || !notes) return;

    this.resolving.set(true);
    this.adminService.resolveReport(report.id, action, notes).subscribe({
      next: () => {
        this.errorHandler.success('تم حل البلاغ');
        this.closeResolve();
        this.resolving.set(false);
        this.loadReports();
      },
      error: () => {
        this.resolving.set(false);
      },
    });
  }

  truncate(text: string, max: number = 60): string {
    if (!text) return '';
    return text.length > max ? text.slice(0, max) + '…' : text;
  }

  get totalPages(): number {
    return Math.ceil(this.total() / this.pageSize) || 1;
  }

  get startEntry(): number {
    return (this.page() - 1) * this.pageSize + 1;
  }

  get endEntry(): number {
    return Math.min(this.page() * this.pageSize, this.total());
  }
}
