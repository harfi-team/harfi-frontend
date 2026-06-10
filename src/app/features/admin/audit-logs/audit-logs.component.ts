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

  getActionLabel(action: string): string {
    const map: Record<string, string> = {
      'approve_craftsman': 'موافقة على حرفي',
      'reject_craftsman': 'رفض حرفي',
      'suspend_craftsman': 'تعليق حرفي',
      'delete_craftsman': 'حذف حرفي',
      'reactivate_user': 'إعادة تفعيل مستخدم',
      'deactivate_user': 'تعطيل مستخدم',
      'delete_user': 'حذف مستخدم',
      'resolve_dispute': 'حل نزاع',
      'flag_dispute': 'تحديد نزاع',
      'view_dispute_messages': 'عرض رسائل النزاع',
      'config_service_type': 'تعديل نوع الخدمة',
      'update_feature_flag': 'تحديث خاصية النظام',
      'resolve_report': 'حل بلاغ',
      'delete_review': 'حذف تقييم',
    };
    return map[action] ?? action;
  }

  getTargetTypeLabel(type: string): string {
    const map: Record<string, string> = {
      'Craftsman': 'حرفي',
      'User': 'مستخدم',
      'Job': 'طلب',
      'Review': 'تقييم',
      'FeatureFlag': 'خاصية النظام',
      'ServiceType': 'نوع الخدمة',
      'City': 'مدينة',
      'Report': 'بلاغ',
    };
    return map[type] ?? type;
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
