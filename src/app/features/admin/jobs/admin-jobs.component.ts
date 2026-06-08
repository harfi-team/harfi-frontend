import { Component, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService } from '../admin.service';
import { JobAdminDto } from '@core/models/admin.models';
import { ErrorHandlerService } from '@core/services/error-handler.service';

const MOCK_JOBS: JobAdminDto[] = [
  { id: 'HRF-#8921', clientName: 'أحمد محمد', clientAvatar: '', craftsmanName: 'خالد سباك', craftsmanAvatar: '', service: 'سباكة - إصلاح تسريب', specialty: 'سباكة', city: 'الرياض', date: '24 مايو، 10:30 ص', status: 'in-progress', hasDispute: false },
  { id: 'HRF-#8919', clientName: 'سارة فهد', clientAvatar: '', craftsmanName: 'محمود نجار', craftsmanAvatar: '', service: 'نجارة - تركيب دواليب', specialty: 'نجارة', city: 'جدة', date: '23 مايو، 04:15 م', status: 'rejected', hasDispute: true },
  { id: 'HRF-#8915', clientName: 'عمر عبدالله', clientAvatar: '', craftsmanName: 'حسن كهربائي', craftsmanAvatar: '', service: 'كهرباء - تأسيس', specialty: 'كهرباء', city: 'الدمام', date: '22 مايو، 09:00 ص', status: 'done', hasDispute: false },
];

type JobFilterTab = 'all' | 'open' | 'in-progress' | 'done' | 'disputed';

@Component({
  selector: 'app-admin-jobs',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, DecimalPipe],
  templateUrl: './admin-jobs.component.html',
  styleUrl: './admin-jobs.component.css',
})
export class AdminJobsComponent {
  private adminService = inject(AdminService);
  private errorHandler = inject(ErrorHandlerService);

  jobs = signal<JobAdminDto[]>([]);
  loading = signal(true);
  total = signal(0);
  activeTab = signal<JobFilterTab>('all');
  page = signal(1);
  pageSize = 10;

  constructor() {
    this.loadJobs();
  }

  loadJobs(): void {
    this.loading.set(true);
    const status = this.activeTab() === 'all' || this.activeTab() === 'disputed'
      ? undefined
      : this.activeTab();
    const params: any = { page: this.page(), pageSize: this.pageSize };
    if (status) params.status = status;

    this.adminService.getJobs(params).subscribe({
      next: (data) => {
        let items = data.items;
        if (this.activeTab() === 'disputed') {
          items = items.filter(j => j.hasDispute);
        } else if (this.activeTab() !== 'all') {
          items = items.filter(j => j.status === this.activeTab());
        }
        this.jobs.set(items);
        this.total.set(data.total);
        this.loading.set(false);
      },
      error: () => {
        let items = MOCK_JOBS;
        if (this.activeTab() === 'disputed') {
          items = items.filter(j => j.hasDispute);
        } else if (this.activeTab() !== 'all') {
          items = items.filter(j => j.status === this.activeTab());
        }
        this.jobs.set(items);
        this.total.set(items.length);
        this.loading.set(false);
      },
    });
  }

  setTab(tab: JobFilterTab): void {
    this.activeTab.set(tab);
    this.page.set(1);
    this.loadJobs();
  }

  changePage(p: number): void {
    this.page.set(p);
    this.loadJobs();
  }

  resolveDispute(jobId: string): void {
    this.adminService.resolveDispute(jobId).subscribe({
      next: () => {
        this.errorHandler.success('تم حل النزاع');
        this.loadJobs();
      },
    });
  }

  exportJobs(): void {
    this.adminService.exportJobs().subscribe({
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

  getStatusClass(status: string): string {
    return status;
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'open': return 'OPEN';
      case 'in-progress': return 'ADMIN.IN_PROGRESS';
      case 'done': return 'ADMIN.COMPLETED';
      case 'rejected': return 'ADMIN.DISPUTED';
      default: return status;
    }
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
