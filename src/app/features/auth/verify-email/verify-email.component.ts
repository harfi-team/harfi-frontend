import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, SpinnerComponent],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css',
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private errorHandler = inject(ErrorHandlerService);

  email = '';
  loading = false;
  resendLoading = false;
  countdown = 0;
  private timer: any;

  form = new FormGroup({
    code: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern(/^\d{6}$/)]),
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      if (!this.email) {
        this.router.navigate(['/auth/login']);
      }
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.authService.verifyEmail({ email: this.email, code: this.form.value.code! }).subscribe({
      next: () => this.router.navigate(['/auth/verify-phone'], { queryParams: { email: this.email } }),
      error: (err) => {
        this.errorHandler.handle(err);
        this.loading = false;
      },
    });
  }

  resendCode(): void {
    if (this.countdown > 0) return;
    this.resendLoading = true;
    this.authService.resendEmailCode({ email: this.email }).subscribe({
      next: () => {
        this.resendLoading = false;
        this.startCountdown();
      },
      error: (err) => {
        this.errorHandler.handle(err);
        this.resendLoading = false;
      },
    });
  }

  private startCountdown(): void {
    this.countdown = 60;
    this.timer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) clearInterval(this.timer);
    }, 1000);
  }

  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '').slice(0, 6);
    this.form.controls.code.setValue(input.value);
  }
}
