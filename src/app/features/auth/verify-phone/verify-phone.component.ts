import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-verify-phone',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, SpinnerComponent],
  templateUrl: './verify-phone.component.html',
  styleUrl: './verify-phone.component.css',
})
export class VerifyPhoneComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private errorHandler = inject(ErrorHandlerService);

  email = '';
  phoneNumber = '';
  step: 'phone' | 'code' = 'phone';
  loading = false;
  resendLoading = false;
  countdown = 0;
  private timer: any;

  phoneForm = new FormGroup({
    phoneNumber: new FormControl('', [Validators.required, Validators.pattern(/^01[0-9]{9}$/)]),
  });

  codeForm = new FormGroup({
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

  sendCode(): void {
    if (this.phoneForm.invalid) return;
    this.loading = true;
    const phoneNumber = this.phoneForm.value.phoneNumber!;
    this.authService.sendPhoneCode({ email: this.email, phoneNumber }).subscribe({
      next: () => {
        this.phoneNumber = phoneNumber;
        this.step = 'code';
        this.loading = false;
        this.startCountdown();
      },
      error: (err) => {
        this.errorHandler.handle(err);
        this.loading = false;
      },
    });
  }

  verifyCode(): void {
    if (this.codeForm.invalid) return;
    this.loading = true;
    this.authService.verifyPhone({ email: this.email, phoneNumber: this.phoneNumber, code: this.codeForm.value.code! }).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (err) => {
        this.errorHandler.handle(err);
        this.loading = false;
      },
    });
  }

  resendCode(): void {
    if (this.countdown > 0) return;
    this.resendLoading = true;
    this.authService.resendPhoneCode({ email: this.email, phoneNumber: this.phoneNumber }).subscribe({
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
    this.codeForm.controls.code.setValue(input.value);
  }
}
