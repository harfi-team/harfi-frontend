import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [FormsModule, TranslateModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css'],
})
export class ConfirmDialogComponent {
  title = input<string>('');
  message = input<string>('');
  confirmLabel = input<string>('CONFIRM');
  cancelLabel = input<string>('CANCEL');
  requireReason = input<boolean>(false);
  reasonLabel = input<string>('ADMIN.REASON_PLACEHOLDER');
  visible = input<boolean>(false);

  confirmed = output<string | undefined>();
  dismissed = output<void>();

  reason = '';

  onConfirm(): void {
    if (this.requireReason() && !this.reason.trim()) {
      return;
    }
    this.confirmed.emit(this.requireReason() ? this.reason : undefined);
    this.reason = '';
  }

  onDismiss(): void {
    this.dismissed.emit();
    this.reason = '';
  }
}
