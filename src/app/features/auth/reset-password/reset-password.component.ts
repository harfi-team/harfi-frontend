import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  showPassword = signal(false);
  showConfirm = signal(false);

  private email = '';

  form = new FormGroup({
    code: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]),
    newPassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmNewPassword: new FormControl('', [Validators.required]),
  }, { validators: this.passwordsMatchValidator });

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';

    if (!this.email) {
      this.errorMessage.set('رابط إعادة التعيين غير صحيح أو منتهي الصلاحية');
    }
  }

  passwordsMatchValidator(group: AbstractControl) {
    const pass = group.get('newPassword')?.value;
    const confirm = group.get('confirmNewPassword')?.value;
    return pass === confirm ? null : { passwordsMismatch: true };
  }

  onSubmit(): void {
    if (this.form.invalid || !this.email) return;
    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.resetPassword({
      email: this.email,
      code: this.form.value.code!,
      newPassword: this.form.value.newPassword!,
      confirmNewPassword: this.form.value.confirmNewPassword!,
    }).subscribe({
      next: (res) => {
        this.successMessage.set(res.message);
        this.loading.set(false);
        setTimeout(() => this.router.navigate(['/auth/login']), 3000);
      },
      error: (err) => {
        this.errorMessage.set(
          err?.error?.message ?? 'حدث خطأ، يرجى المحاولة مرة أخرى'
        );
        this.loading.set(false);
      },
    });
  }

  togglePassword(field: 'password' | 'confirm'): void {
    if (field === 'password') this.showPassword.set(!this.showPassword());
    else this.showConfirm.set(!this.showConfirm());
  }
}
