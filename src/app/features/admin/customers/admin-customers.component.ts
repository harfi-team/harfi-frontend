import { Component, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService } from '../admin.service';
import { AdminUser } from '@core/models/admin.models';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, DecimalPipe, ConfirmDialogComponent],
  templateUrl: './admin-customers.component.html',
  styleUrl: './admin-customers.component.css',
})
export class AdminCustomersComponent {
  private adminService = inject(AdminService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);

  users = signal<AdminUser[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  pageSize = 50;
  search = signal('');

  dialogVisible = signal(false);
  dialogTitle = signal('');
  dialogMessage = signal('');
  dialogRequireReason = signal(false);
  dialogReasonLabel = signal('');
  dialogConfirmLabel = signal('CONFIRM');
  pendingAction: { type: string; id: number } | null = null;

  constructor() {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.adminService.getUsers('customer', undefined, this.search() || undefined, this.page(), this.pageSize).subscribe({
      next: (data) => {
        this.users.set(data.items);
        this.total.set(data.totalCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(): void {
    this.page.set(1);
    this.loadUsers();
  }

  changePage(p: number): void {
    this.page.set(p);
    this.loadUsers();
  }

  openAction(type: string, id: number): void {
    this.pendingAction = { type, id };
    this.dialogRequireReason.set(type !== 'reactivate');
    this.dialogTitle.set('ADMIN.CONFIRM_TITLE');
    this.dialogMessage.set(type === 'reactivate' ? 'ADMIN.CONFIRM_MESSAGE' : 'ADMIN.CONFIRM_DELETE_MESSAGE');
    this.dialogReasonLabel.set(type === 'delete' ? 'ADMIN.DELETION_REASON' : 'ADMIN.SUSPENSION_REASON');
    this.dialogConfirmLabel.set(type === 'reactivate' ? 'ADMIN.REACTIVATE' : type === 'deactivate' ? 'ADMIN.DEACTIVATE' : 'DELETE');
    this.dialogVisible.set(true);
  }

  onDialogConfirmed(reason?: string): void {
    if (!this.pendingAction) return;
    const { type, id } = this.pendingAction;
    const call$ = type === 'deactivate' ? this.adminService.deactivateUser(id, reason!)
      : type === 'reactivate' ? this.adminService.reactivateUser(id)
      : this.adminService.deleteUser(id, reason!);

    call$.subscribe({
      next: (res) => {
        this.errorHandler.success(res.message || 'تمت العملية بنجاح');
        this.dialogVisible.set(false);
        this.loadUsers();
      },
      error: () => this.dialogVisible.set(false),
    });
  }

  viewDetail(id: number): void {
    this.router.navigate(['/admin/users', id]);
  }

  getBadge(u: any): { label: string; cssClass: string } {
    if (u.isDeleted) return { label: 'ADMIN.DELETED', cssClass: 'deleted' };
    if (!u.isActive) return { label: 'ADMIN.DEACTIVATED', cssClass: 'pending' };
    return { label: 'ADMIN.ACTIVATED', cssClass: 'approved' };
  }

  showActions(u: any): { deactivate: boolean; reactivate: boolean; delete: boolean } {
    return {
      deactivate: u.isActive === true && u.isDeleted !== true,
      reactivate: u.isActive === false && u.isDeleted !== true,
      delete: u.isDeleted !== true,
    };
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
