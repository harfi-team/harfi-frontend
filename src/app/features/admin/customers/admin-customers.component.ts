import { Component, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService } from '../admin.service';
import { CustomerAdminDto } from '@core/models/admin.models';
import { ErrorHandlerService } from '@core/services/error-handler.service';

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, DecimalPipe],
  templateUrl: './admin-customers.component.html',
  styleUrl: './admin-customers.component.css',
})
export class AdminCustomersComponent {
  private adminService = inject(AdminService);
  private errorHandler = inject(ErrorHandlerService);

  customers = signal<CustomerAdminDto[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  pageSize = 10;
  search = signal('');

  constructor() {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading.set(true);
    this.adminService.getCustomers({
      search: this.search() || undefined,
      page: this.page(),
      pageSize: this.pageSize,
    }).subscribe({
      next: (data) => {
        this.customers.set(data.items);
        this.total.set(data.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(): void {
    this.page.set(1);
    this.loadCustomers();
  }

  changePage(p: number): void {
    this.page.set(p);
    this.loadCustomers();
  }

  deleteCustomer(id: string): void {
    this.adminService.deleteCustomer(id).subscribe({
      next: () => {
        this.errorHandler.success('تم حذف العميل');
        this.loadCustomers();
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
}
