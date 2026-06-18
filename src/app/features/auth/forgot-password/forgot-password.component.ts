import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService.forgotPassword(this.form.value.email!).subscribe({
      next: (res) => {
        this.successMessage.set(res.message);
        this.loading.set(false);
        this.router.navigate(['/auth/reset-password'], {
          queryParams: { email: this.form.value.email },
        });
      },
      error: (err) => {
        this.errorMessage.set(
          err?.error?.message ?? 'حدث خطأ، يرجى المحاولة مرة أخرى'
        );
        this.loading.set(false);
      },
    });
  }
}
