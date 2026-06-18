import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { AdminService } from '../admin.service';
import { AdminUserDetail } from '@core/models/admin.models';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { environment } from '@env/environment';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, DatePipe, ConfirmDialogComponent],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.css',
})
export class UserDetailComponent {
  private adminService = inject(AdminService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  user = signal<AdminUserDetail | null>(null);
  activities = signal<any[]>([]);
  loading = signal(true);
  error = signal(false);

  dialogVisible = signal(false);
  dialogTitle = signal('');
  dialogMessage = signal('');
  dialogRequireReason = signal(false);
  dialogReasonLabel = signal('');
  dialogConfirmLabel = signal('');
  pendingAction: { type: string } | null = null;

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }
    forkJoin({
      user: this.adminService.getUserById(id),
      activities: this.adminService.getUserActivity(id),
    }).subscribe({
      next: (data) => {
        this.user.set(data.user);
        this.activities.set(data.activities);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/customers']);
  }

  openDeactivate(): void {
    this.pendingAction = { type: 'deactivate' };
    this.dialogRequireReason.set(true);
    this.dialogTitle.set('ADMIN.CONFIRM_TITLE');
    this.dialogMessage.set('ADMIN.CONFIRM_DEACTIVATE_MESSAGE');
    this.dialogReasonLabel.set('ADMIN.SUSPENSION_REASON');
    this.dialogConfirmLabel.set('ADMIN.DEACTIVATE');
    this.dialogVisible.set(true);
  }

  openReactivate(): void {
    this.pendingAction = { type: 'reactivate' };
    this.dialogRequireReason.set(false);
    this.dialogTitle.set('ADMIN.CONFIRM_TITLE');
    this.dialogMessage.set('ADMIN.CONFIRM_REACTIVATE_MESSAGE');
    this.dialogReasonLabel.set('');
    this.dialogConfirmLabel.set('ADMIN.REACTIVATE');
    this.dialogVisible.set(true);
  }

  openDelete(): void {
    this.pendingAction = { type: 'delete' };
    this.dialogRequireReason.set(true);
    this.dialogTitle.set('ADMIN.CONFIRM_TITLE');
    this.dialogMessage.set('ADMIN.CONFIRM_DELETE_USER_MESSAGE');
    this.dialogReasonLabel.set('ADMIN.DELETION_REASON');
    this.dialogConfirmLabel.set('DELETE');
    this.dialogVisible.set(true);
  }

  getImageUrl(path: string | null | undefined): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${environment.apiBaseUrl.replace('/api', '')}${path}`;
  }

  getActionLabel(action: string): string {
    const map: Record<string, string> = {
      'delete_user': 'حذف المستخدم',
      'deactivate_user': 'إيقاف تفعيل المستخدم',
      'activate_user': 'إعادة تفعيل المستخدم',
      'reactivate_user': 'إعادة تفعيل المستخدم',
      'approve_craftsman': 'قبول الحرفي',
      'reject_craftsman': 'رفض الحرفي',
      'update_user': 'تعديل بيانات المستخدم',
      'ban_user': 'حظر المستخدم',
    };
    return map[action] ?? action;
  }

  onDialogConfirmed(reason?: string): void {
    if (!this.pendingAction) return;
    const u = this.user();
    if (!u) return;
    const { type } = this.pendingAction;
    const call$ = type === 'deactivate' ? this.adminService.deactivateUser(u.id, reason!)
      : type === 'reactivate' ? this.adminService.reactivateUser(u.id)
      : this.adminService.deleteUser(u.id, reason!);

    call$.subscribe({
      next: (res) => {
        this.errorHandler.success(res.message || 'تمت العملية بنجاح');
        this.dialogVisible.set(false);
        this.router.navigate(['/admin/customers']);
      },
      error: () => this.dialogVisible.set(false),
    });
  }
}
