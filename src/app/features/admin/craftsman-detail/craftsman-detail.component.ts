import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService } from '../admin.service';
import { CraftsmanDetail } from '@core/models/admin.models';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { environment } from '@env/environment';

@Component({
  selector: 'app-craftsman-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, ConfirmDialogComponent],
  templateUrl: './craftsman-detail.component.html',
  styleUrl: './craftsman-detail.component.css',
})
export class CraftsmanDetailComponent {
  private adminService = inject(AdminService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  craftsman = signal<CraftsmanDetail | null>(null);
  loading = signal(true);
  error = signal(false);

  dialogVisible = signal(false);
  dialogTitle = signal('');
  dialogMessage = signal('');
  dialogRequireReason = signal(false);
  dialogReasonLabel = signal('');
  dialogConfirmLabel = signal('');
  pendingAction: { type: string; id: number } | null = null;

  status = computed(() => {
    const c = this.craftsman();
    if (!c) return '';
    if (c.isDeleted) return 'deleted';
    if (c.rejectionReason) return 'rejected';
    if (c.isApproved && !c.isAvailable) return 'suspended';
    if (c.isApproved) return 'approved';
    return 'pending';
  });

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(id)) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }
    this.adminService.getCraftsmanById(id).subscribe({
      next: (data) => {
        this.craftsman.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/craftsmen']);
  }

  getStatusLabel(): string {
    switch (this.status()) {
      case 'approved': return 'ADMIN.APPROVED';
      case 'pending': return 'ADMIN.PENDING_APPROVAL';
      case 'rejected': return 'ADMIN.REJECTED_STATUS';
      case 'suspended': return 'ADMIN.SUSPENDED';
      case 'deleted': return 'ADMIN.DELETED';
      default: return '';
    }
  }

  getStatusClass(): string {
    switch (this.status()) {
      case 'approved': return 'status--approved';
      case 'pending': return 'status--pending';
      case 'rejected': return 'status--rejected';
      case 'suspended': return 'status--suspended';
      case 'deleted': return 'status--deleted';
      default: return '';
    }
  }

  getImageUrl(path: string | null | undefined): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${environment.apiBaseUrl.replace('/api', '')}${path}`;
  }

  viewNationalId(): void {
    const url = this.craftsman()?.nationalIdUrl;
    if (url) window.open(url, '_blank');
  }

  openAction(type: string): void {
    const c = this.craftsman();
    if (!c) return;
    this.pendingAction = { type, id: c.id };
    this.dialogRequireReason.set(type !== 'approve');
    if (type === 'approve') {
      this.dialogTitle.set('ADMIN.CONFIRM_APPROVE');
      this.dialogMessage.set('ADMIN.CONFIRM_APPROVE_MSG');
      this.dialogConfirmLabel.set('APPROVE');
    } else if (type === 'reject') {
      this.dialogTitle.set('ADMIN.CONFIRM_REJECT');
      this.dialogMessage.set('ADMIN.CONFIRM_REJECT_MSG');
      this.dialogReasonLabel.set('ADMIN.REJECTION_REASON');
      this.dialogConfirmLabel.set('REJECT');
    } else if (type === 'suspend') {
      this.dialogTitle.set('ADMIN.CONFIRM_SUSPEND');
      this.dialogMessage.set('ADMIN.CONFIRM_SUSPEND_MSG');
      this.dialogReasonLabel.set('ADMIN.SUSPENSION_REASON');
      this.dialogConfirmLabel.set('ADMIN.SUSPEND');
    } else if (type === 'delete') {
      this.dialogTitle.set('ADMIN.CONFIRM_DELETE');
      this.dialogMessage.set('ADMIN.CONFIRM_DELETE_MSG');
      this.dialogReasonLabel.set('ADMIN.DELETION_REASON');
      this.dialogConfirmLabel.set('DELETE');
    }
    this.dialogVisible.set(true);
  }

  onDialogConfirmed(reason?: string): void {
    if (!this.pendingAction) return;
    const { type, id } = this.pendingAction;
    const call$ = type === 'approve' ? this.adminService.approveCraftsman(id, reason)
      : type === 'reject' ? this.adminService.rejectCraftsman(id, reason!)
      : type === 'suspend' ? this.adminService.suspendCraftsman(id, reason!)
      : this.adminService.deleteCraftsman(id, reason!);

    call$.subscribe({
      next: (res) => {
        this.errorHandler.success(res.message || 'تمت العملية بنجاح');
        this.dialogVisible.set(false);
        this.router.navigate(['/admin/craftsmen']);
      },
      error: () => this.dialogVisible.set(false),
    });
  }
}
