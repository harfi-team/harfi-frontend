import { Component, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

export const passwordMatchValidator: ValidatorFn = (
  group: AbstractControl,
): ValidationErrors | null => {
  const password = group.get('password');
  const confirm = group.get('confirmPassword');
  return password && confirm && password.value !== confirm.value
    ? { passwordMismatch: true }
    : null;
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgClass, TranslatePipe, SpinnerComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private errorHandler = inject(ErrorHandlerService);

  loading = false;
  showPassword = false;
  showConfirm = false;

  get passwordStrength(): number {
    const val = this.form.controls.password.value ?? '';
    let score = 0;
    if (val.length >= 8) score++;
    if (/[a-z]/.test(val) && /[A-Z]/.test(val)) score++;
    if (/\d/.test(val)) score++;
    if (/[^a-zA-Z0-9]/.test(val)) score++;
    return score;
  }

  form = new FormGroup(
    {
      name: new FormControl('', [Validators.required, Validators.minLength(3)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      phone: new FormControl('', [Validators.pattern(/^01[0-9]{9}$/)]),
      password: new FormControl('', [Validators.required, Validators.minLength(8)]),
      confirmPassword: new FormControl('', [Validators.required]),
      role: new FormControl<'customer' | 'craftsman'>('customer', [Validators.required]),
    },
    { validators: passwordMatchValidator },
  );

  setRole(role: 'customer' | 'craftsman'): void {
    this.form.controls.role.setValue(role);
  }

  onSubmit(): void {
  if (this.form.invalid) return;
  this.loading = true;
  this.authService.register(this.form.value as any).subscribe({
    next: (res) => {
      // التوجيه مباشرة لصفحة تفعيل الإيميل وتمريره في الـ Query Params
      this.router.navigate(['/auth/verify-email'], { 
        queryParams: { email: res.user?.email } 
      });
    },
    error: (err) => {
      this.errorHandler.handle(err);
      this.loading = false;
    },
  });
}

  togglePassword(field: 'password' | 'confirm'): void {
    if (field === 'password') this.showPassword = !this.showPassword;
    else this.showConfirm = !this.showConfirm;
  }
}
