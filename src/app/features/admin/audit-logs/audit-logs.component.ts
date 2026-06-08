import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService } from '../admin.service';
import { AuditLog } from '@core/models/admin.models';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './audit-logs.component.html',
  styleUrl: './audit-logs.component.css',
})
export class AuditLogsComponent {
  private adminService = inject(AdminService);

  logs = signal<AuditLog[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  pageSize = 20;

  actionFilter = signal('');
  targetTypeFilter = signal('');
  fromDate = signal('');
  toDate = signal('');

  selectedLog = signal<AuditLog | null>(null);
  detailLoading = signal(false);

  targetTypeOptions = ['USER', 'CRAFTSMAN', 'JOB', 'REVIEW', 'REPORT', 'SETTING'];

  constructor() {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading.set(true);
    this.adminService.getAuditLogs(
      undefined,
      this.actionFilter() || undefined,
      this.targetTypeFilter() || undefined,
      this.fromDate() || undefined,
      this.toDate() || undefined,
      this.page(),
      this.pageSize,
    ).subscribe({
      next: (data) => {
        this.logs.set(data.items);
        this.total.set(data.totalCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFilter(): void {
    this.page.set(1);
    this.loadLogs();
  }

  changePage(p: number): void {
    this.page.set(p);
    this.loadLogs();
  }

  showDetail(log: AuditLog): void {
    this.detailLoading.set(true);
    this.adminService.getAuditLogById(log.id).subscribe({
      next: (data) => {
        this.selectedLog.set(data);
        this.detailLoading.set(false);
      },
      error: () => this.detailLoading.set(false),
    });
  }

  closeDetail(): void {
    this.selectedLog.set(null);
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
