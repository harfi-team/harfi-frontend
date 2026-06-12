import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CraftsmanService } from '../craftsman.service';
import { CraftsmanRegistrationDto } from '../../../core/models/craftsman.models';

// ── Validator: priceRangeMax يجب أن يكون أكبر من priceRangeMin ──
function priceRangeValidator(group: AbstractControl): ValidationErrors | null {
  const min = group.get('priceRangeMin')?.value;
  const max = group.get('priceRangeMax')?.value;
  if (
    min !== null &&
    min !== '' &&
    max !== null &&
    max !== '' &&
    Number(max) <= Number(min)
  ) {
    return { priceRangeInvalid: true };
  }
  return null;
}

@Component({
  selector: 'app-craftsman-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './craftsman-register.component.html',
  styleUrls: ['./craftsman-register.component.css'],
})
export class CraftsmanRegisterComponent implements OnInit {
  registerForm!: FormGroup;
  selectedFileName: string = '';
  isLoading: boolean = false;
  showSuccessModal: boolean = false;
  errorMessage: string = '';

  serviceTypes: string[] = [
    'سباكة',
    'كهرباء',
    'نجارة',
    'دهان',
    'تكييف',
    'تنظيف',
    'أخرى',
  ];

  constructor(
    private fb: FormBuilder,
    private craftsmanService: CraftsmanService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // ── جلب userId من localStorage – يدعم أشكال مختلفة للتخزين ──
    const userId = this.getCurrentUserId();

    // ── لو مفيش userId معناه اليوزر مش logged in، نرجعه للـ auth ──
    if (!userId) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.registerForm = this.fb.group(
      {
        userId: [userId],
        serviceType: ['', Validators.required],
        city: ['', Validators.required],
        neighborhood: ['', [Validators.required, Validators.minLength(2)]],
        priceRangeMin: [null, [Validators.required, Validators.min(0)]],
        priceRangeMax: [null, [Validators.required, Validators.min(1)]],
        experience: [
          1,
          [Validators.required, Validators.min(0), Validators.max(50)],
        ],
        bio: [
          '',
          [
            Validators.required,
            Validators.minLength(20),
            Validators.maxLength(300),
          ],
        ],
        nationalIdUrl: [
          '',
          [Validators.required, Validators.pattern('https?://.+')],
        ],
      },
      { validators: priceRangeValidator }
    );
  }

  // ── استخراج userId من localStorage بأشكال مختلفة ──
  private getCurrentUserId(): number {
    try {
      // الشكل الأول: { id: number, ... }
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const parsed = JSON.parse(currentUser);
        if (parsed?.id) return Number(parsed.id);
      }

      // الشكل الثاني: { user: { id: number } }
      const authData = localStorage.getItem('authData');
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed?.user?.id) return Number(parsed.user.id);
        if (parsed?.id) return Number(parsed.id);
      }

      // الشكل الثالث: userId مباشرة
      const userId = localStorage.getItem('userId');
      if (userId) return Number(userId);

      // sessionStorage كـ fallback
      const sessionUser = sessionStorage.getItem('currentUser');
      if (sessionUser) {
        const parsed = JSON.parse(sessionUser);
        if (parsed?.id) return Number(parsed.id);
      }
    } catch {
      // silent fail
    }
    return 0;
  }

  // ── Getters للاختصار في الـ HTML ──
  get f() {
    return this.registerForm.controls;
  }

  get bioLength(): number {
    return this.registerForm.get('bio')?.value?.length ?? 0;
  }

  get priceRangeInvalid(): boolean {
    return (
      this.registerForm.hasError('priceRangeInvalid') &&
      (this.registerForm.get('priceRangeMin')?.touched ?? false) &&
      (this.registerForm.get('priceRangeMax')?.touched ?? false)
    );
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.selectedFileName = file.name;
    }
  }

  setServiceType(type: string): void {
    this.registerForm.get('serviceType')?.setValue(type);
    this.registerForm.get('serviceType')?.markAsTouched();
  }

  incrementExperience(): void {
    const current = this.registerForm.get('experience')?.value ?? 0;
    if (current < 50) {
      this.registerForm.get('experience')?.setValue(current + 1);
    }
  }

  decrementExperience(): void {
    const current = this.registerForm.get('experience')?.value ?? 0;
    if (current > 0) {
      this.registerForm.get('experience')?.setValue(current - 1);
    }
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // ── بناء الـ payload بالشكل الصح للـ API ──
    const formVal = this.registerForm.value;
    const payload: CraftsmanRegistrationDto = {
      userId: formVal.userId,
      serviceType: formVal.serviceType,
      city: formVal.city,
      neighborhood: formVal.neighborhood,
      priceRangeMin: Number(formVal.priceRangeMin),
      priceRangeMax: Number(formVal.priceRangeMax),
      experience: Number(formVal.experience),
      bio: formVal.bio,
      nationalIdUrl: formVal.nationalIdUrl,
    };

    this.craftsmanService.register(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.showSuccessModal = true;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(err);
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth',
        });
      },
    });
  }

  private getErrorMessage(err: any): string {
    if (err.status === 400) {
      // محاولة استخراج رسالة الخطأ من الـ API
      const apiMsg =
        err.error?.message ||
        err.error?.title ||
        err.error?.errors?.join(', ');
      if (apiMsg) return apiMsg;
      return 'البيانات المدخلة غير صحيحة. يرجى مراجعة الحقول والمحاولة مرة أخرى.';
    }
    if (err.status === 401) {
      return 'انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.';
    }
    if (err.status === 409) {
      return 'لديك طلب تسجيل سابق قيد المراجعة بالفعل.';
    }
    if (err.status === 0) {
      return 'لا يمكن الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.';
    }
    return 'حدث خطأ أثناء إرسال البيانات. يرجى المحاولة لاحقاً.';
  }

  // ── لما اليوزر يضغط "الصفحة الرئيسية" في الـ Modal ──
  goHome(): void {
    this.showSuccessModal = false;
    this.router.navigate(['/home']);
  }
}