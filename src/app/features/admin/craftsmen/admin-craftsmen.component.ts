import { Component, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService } from '../admin.service';
import { CraftsmanAdminDto } from '@core/models/admin.models';
import { ErrorHandlerService } from '@core/services/error-handler.service';

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected';

const MOCK_CRAFTSMEN: CraftsmanAdminDto[] = [
  { id: '1', name: 'أحمد محمود', phone: '0501234567', specialty: 'سباكة', city: 'الرياض', status: 'pending', registrationDate: '15 مايو 2024' },
  { id: '2', name: 'سالم عبدالله', phone: '0559876543', specialty: 'كهرباء', city: 'جدة', status: 'approved', registrationDate: '12 مايو 2024' },
  { id: '3', name: 'محمد علي', phone: '0561122334', specialty: 'نجارة', city: 'مكة', status: 'approved', registrationDate: '10 مايو 2024' },
  { id: '4', name: 'خالد حسن', phone: '0509988776', specialty: 'سباكة', city: 'الرياض', status: 'rejected', registrationDate: '8 مايو 2024' },
  { id: '5', name: 'فهد عمر', phone: '0533445566', specialty: 'كهرباء', city: 'الدمام', status: 'pending', registrationDate: '5 مايو 2024' },
  { id: '6', name: 'ياسر إبراهيم', phone: '0545678901', specialty: 'دهانات', city: 'جدة', status: 'approved', registrationDate: '3 مايو 2024' },
  { id: '7', name: 'سعيد محمد', phone: '0581234987', specialty: 'سباكة', city: 'المدينة', status: 'pending', registrationDate: '1 مايو 2024' },
  { id: '8', name: 'ناصر عبدالرحمن', phone: '0598765432', specialty: 'نجارة', city: 'الرياض', status: 'approved', registrationDate: '28 أبريل 2024' },
  { id: '9', name: 'ماجد فهد', phone: '0554433221', specialty: 'كهرباء', city: 'الخبر', status: 'approved', registrationDate: '25 أبريل 2024' },
  { id: '10', name: 'بندر سعد', phone: '0501112233', specialty: 'تكييف', city: 'جدة', status: 'rejected', registrationDate: '20 أبريل 2024' },
];

@Component({
  selector: 'app-admin-craftsmen',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, DecimalPipe],
  templateUrl: './admin-craftsmen.component.html',
  styleUrl: './admin-craftsmen.component.css',
})
export class AdminCraftsmenComponent {
  private adminService = inject(AdminService);
  private errorHandler = inject(ErrorHandlerService);

  craftsmen = signal<CraftsmanAdminDto[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  pageSize = 10;
  search = signal('');
  city = signal('');
  specialty = signal('');
  activeTab = signal<FilterTab>('all');

  constructor() {
    this.loadCraftsmen();
  }

  loadCraftsmen(): void {
    this.loading.set(true);
    const status = this.activeTab() === 'all' ? undefined : this.activeTab();
    this.adminService.getCraftsmen({
      search: this.search() || undefined,
      city: this.city() || undefined,
      specialty: this.specialty() || undefined,
      status,
      page: this.page(),
      pageSize: this.pageSize,
    }).subscribe({
      next: (data) => {
        this.craftsmen.set(data.items);
        this.total.set(data.total);
        this.loading.set(false);
      },
      error: () => {
        this.craftsmen.set(MOCK_CRAFTSMEN);
        this.total.set(MOCK_CRAFTSMEN.length);
        this.loading.set(false);
      },
    });
  }

  setTab(tab: FilterTab): void {
    this.activeTab.set(tab);
    this.page.set(1);
    this.loadCraftsmen();
  }

  onSearch(): void {
    this.page.set(1);
    this.loadCraftsmen();
  }

  changePage(p: number): void {
    this.page.set(p);
    this.loadCraftsmen();
  }

  approve(id: string): void {
    this.adminService.approveCraftsman(id).subscribe({
      next: () => {
        this.errorHandler.success('تم الموافقة على الحرفي');
        this.loadCraftsmen();
      },
    });
  }

  reject(id: string): void {
    this.adminService.rejectCraftsman(id).subscribe({
      next: () => {
        this.errorHandler.success('تم رفض الحرفي');
        this.loadCraftsmen();
      },
    });
  }

  deleteCraftsman(id: string): void {
    this.adminService.deleteCraftsman(id).subscribe({
      next: () => {
        this.errorHandler.success('تم حذف الحرفي');
        this.loadCraftsmen();
      },
    });
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

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'ADMIN.PENDING_APPROVAL';
      case 'approved': return 'ADMIN.APPROVED';
      case 'rejected': return 'ADMIN.REJECTED_STATUS';
      default: return status;
    }
  }
}
