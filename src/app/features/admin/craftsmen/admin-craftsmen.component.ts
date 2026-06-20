import { Component, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { AdminService } from '../admin.service';
import { PendingCraftsman, ApprovedCraftsman, RejectedCraftsman, ServiceType, City } from '@core/models/admin.models';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { environment } from '@env/environment';

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected';

@Component({
  selector: 'app-admin-craftsmen',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, DecimalPipe, ConfirmDialogComponent],
  templateUrl: './admin-craftsmen.component.html',
  styleUrl: './admin-craftsmen.component.css',
})
export class AdminCraftsmenComponent {
  private adminService = inject(AdminService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);

  allPending = signal<PendingCraftsman[]>([]);
  allApproved = signal<ApprovedCraftsman[]>([]);
  allRejected = signal<RejectedCraftsman[]>([]);
  cities = signal<City[]>([]);
  serviceTypes = signal<ServiceType[]>([]);
  loading = signal(true);
  activeTab = signal<FilterTab>('all');
  search = signal('');
  cityFilter = signal('');
  specialtyFilter = signal('');

  dialogVisible = signal(false);
  dialogTitle = signal('');
  dialogMessage = signal('');
  dialogRequireReason = signal(false);
  dialogReasonLabel = signal('');
  dialogConfirmLabel = signal('CONFIRM');
  pendingAction: { type: string; id: number } | null = null;

  constructor() {
    this.loadAll();
    this.adminService.getCities().subscribe({ next: (data) => this.cities.set(data) });
    this.adminService.getServiceTypes().subscribe({ next: (data) => this.serviceTypes.set(data) });
  }

  loadAll(): void {
    this.loading.set(true);
    forkJoin({
      pending: this.adminService.getPendingCraftsmen(1, 100),
      approved: this.adminService.getApprovedCraftsmen(1, 100),
      rejected: this.adminService.getRejectedCraftsmen(1, 100),
    }).subscribe({
      next: (data) => {
        this.allPending.set(data.pending.items);
        this.allApproved.set(data.approved.items);
        this.allRejected.set(data.rejected.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  get totalCount(): number {
    return this.allPending().length + this.allApproved().length + this.allRejected().length;
  }

  get filteredItems(): (PendingCraftsman | ApprovedCraftsman | RejectedCraftsman)[] {
    const s = this.search().toLowerCase();
    const c = this.cityFilter();
    const sp = this.specialtyFilter();
    let items: (PendingCraftsman | ApprovedCraftsman | RejectedCraftsman)[] = [];
    switch (this.activeTab()) {
      case 'pending': items = this.allPending(); break;
      case 'approved': items = this.allApproved(); break;
      case 'rejected': items = this.allRejected(); break;
      default: items = [...this.allPending(), ...this.allApproved(), ...this.allRejected()];
    }
    return items.filter(item => {
      if (s && !item.fullName.toLowerCase().includes(s) && !item.phone.includes(s)) return false;
      if (c && item.city !== c) return false;
      if (sp && item.serviceType !== sp) return false;
      return true;
    });
  }

  setTab(tab: FilterTab): void {
    this.activeTab.set(tab);
  }

  getBadge(item: any): { label: string; cssClass: string } {
    if (item.isDeleted) return { label: 'ADMIN.DELETED', cssClass: 'deleted' };
    if ('rejectionReason' in item || this.activeTab() === 'rejected') return { label: 'ADMIN.REJECTED_STATUS', cssClass: 'rejected' };
    if ('isAvailable' in item) {
      if (item.isAvailable === false) return { label: 'ADMIN.SUSPENDED_STATUS', cssClass: 'suspended' };
      return { label: 'ADMIN.ACTIVE', cssClass: 'approved' };
    }
    return { label: 'ADMIN.PENDING_APPROVAL', cssClass: 'pending' };
  }

  showActions(item: any): { approve: boolean; reject: boolean; suspend: boolean; reactivate: boolean; view: boolean; delete: boolean } {
    const isDeleted = item.isDeleted === true;
    const isApproved = item.isApproved === true;
    const isAvailable = item.isAvailable === true;
    return {
      approve: !isApproved && !isDeleted,
      reject: !isApproved && !isDeleted,
      suspend: isApproved && isAvailable && !isDeleted,
      reactivate: isApproved && !isAvailable && !isDeleted,
      view: true,
      delete: !isDeleted,
    };
  }

  openAction(type: string, id: number): void {
    this.pendingAction = { type, id };
    this.dialogRequireReason.set(type !== 'approve' && type !== 'reactivate');
    this.dialogTitle.set('ADMIN.CONFIRM_TITLE');
    this.dialogMessage.set('ADMIN.CONFIRM_MESSAGE');
    this.dialogReasonLabel.set(type === 'reject' ? 'ADMIN.REJECTION_REASON' : type === 'suspend' ? 'ADMIN.SUSPENSION_REASON' : 'ADMIN.DELETION_REASON');
    this.dialogConfirmLabel.set(type === 'approve' ? 'APPROVE' : type === 'suspend' ? 'ADMIN.SUSPEND' : type === 'reactivate' ? 'ADMIN.REACTIVATE' : 'DELETE');
    this.dialogVisible.set(true);
  }

  onDialogConfirmed(reason?: string): void {
    if (!this.pendingAction) return;
    const { type, id } = this.pendingAction;
    const call$ = type === 'approve' ? this.adminService.approveCraftsman(id, reason)
      : type === 'reject' ? this.adminService.rejectCraftsman(id, reason!)
      : type === 'suspend' ? this.adminService.suspendCraftsman(id, reason!)
      : type === 'reactivate' ? this.adminService.reactivateCraftsman(id)
      : this.adminService.deleteCraftsman(id, reason!);

    call$.subscribe({
      next: (res) => {
        this.errorHandler.success(res.message || 'تمت العملية بنجاح');
        this.dialogVisible.set(false);
        this.loadAll();
      },
      error: () => this.dialogVisible.set(false),
    });
  }

  viewDetail(id: number): void {
    this.router.navigate(['/admin/craftsmen', id]);
  }

  getImageUrl(path: string | null | undefined): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${environment.apiBaseUrl.replace('/api', '')}${path}`;
  }

  emptyMessage(): string {
    switch (this.activeTab()) {
      case 'pending': return 'ADMIN.EMPTY_CRAFTSMEN_PENDING';
      case 'approved': return 'ADMIN.EMPTY_CRAFTSMEN_APPROVED';
      case 'rejected': return 'ADMIN.EMPTY_CRAFTSMEN_REJECTED';
      default: return 'ADMIN.EMPTY_CRAFTSMEN_ALL';
    }
  }
}
