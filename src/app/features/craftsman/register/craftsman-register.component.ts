import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import {FormBuilder,FormGroup,Validators,ReactiveFormsModule,AbstractControl,ValidationErrors,} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { CraftsmanService } from '../craftsman.service';
import {
  ActiveCityDto,
  ActiveServiceDto,
  CraftsmanRegistrationDto,
} from '../../../core/models/craftsman.models';

// ── Validator: priceRangeMax يجب أن يكون أكبر من priceRangeMin ──
function priceRangeValidator(group: AbstractControl): ValidationErrors | null {
  const min = group.get('priceRangeMin')?.value;
  const max = group.get('priceRangeMax')?.value;
  if (
    min !== null && min !== '' &&
    max !== null && max !== '' &&
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

  activeServices: ActiveServiceDto[] = [];
  activeCities: ActiveCityDto[] = [];
  profileImageFile: File | null = null;
  nationalIdFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private craftsmanService: CraftsmanService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const userId = this.getCurrentUserId();

    // ── نبني الفورم أولاً دايماً عشان template لا يعمل error ──
    this.registerForm = this.fb.group(
      {
        userId: [userId],
        serviceType: ['', Validators.required],
        city: ['', Validators.required],
        neighborhood: ['', [Validators.required, Validators.minLength(2)]],
        priceRangeMin: [null, [Validators.required, Validators.min(0)]],
        priceRangeMax: [null, [Validators.required, Validators.min(1)]],
        experience: [1, [Validators.required, Validators.min(0), Validators.max(50)]],
        bio: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(300)]],
        nationalIdUrl: [''],
      },
      { validators: priceRangeValidator }
    );

    // ── تحميل الخدمات والمدن المتاحة ──
    forkJoin({
      services: this.craftsmanService.getActiveServices(),
      cities: this.craftsmanService.getActiveCities(),
    }).subscribe({
      next: ({ services, cities }) => {
        this.activeServices = services;
        this.activeCities = cities;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[Register] Failed to load active services/cities:', err);
      },
    });
  }

  // ── استخراج userId من أي شكل ممكن يتخزن فيه بعد اللوجين ──
  private getCurrentUserId(): number {
  try {
    // 1. نقرأ المفتاح الصحيح من الـ Local Storage
    const raw = localStorage.getItem('harfi_user'); 
    
    if (raw) {
      // 2. نحول النص إلى Object
      const parsed = JSON.parse(raw);
      
      // 3. نجيب الـ id من جواه
      const id = parsed?.id; 
      
      // 4. نتأكد إنه بيتحول لرقم ونرجعه
      if (id) {
        return Number(id);
      }
    }
  } catch (error) {
    console.error("خطأ في قراءة بيانات المستخدم:", error);
  }
  return 0; // يرجع 0 فقط لو مفيش يوزر مسجل
}

  get f() { return this.registerForm.controls; }

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
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.selectedFileName = file.name;
  }

  onProfileImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.profileImageFile = file ?? null;
  }

  onNationalIdSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.nationalIdFile = file ?? null;
  }

  setServiceType(type: string): void {
    this.registerForm.get('serviceType')?.setValue(type);
    this.registerForm.get('serviceType')?.markAsTouched();
  }

  incrementExperience(): void {
    const v = this.registerForm.get('experience')?.value ?? 0;
    if (v < 50) this.registerForm.get('experience')?.setValue(v + 1);
  }

  decrementExperience(): void {
    const v = this.registerForm.get('experience')?.value ?? 0;
    if (v > 0) this.registerForm.get('experience')?.setValue(v - 1);
  }

  onSubmit(): void {
    if (!this.nationalIdFile) {
      this.errorMessage = 'يرجى إرفاق صورة الهوية الوطنية.';
      this.registerForm.get('nationalIdUrl')?.markAsTouched();
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      return;
    }

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // ── رفع صورة الهوية أولاً ──
    this.craftsmanService.uploadNationalIdFile(this.nationalIdFile).subscribe({
      next: (res) => {
        const nationalIdUrl = res.url;
        this.registerForm.patchValue({ nationalIdUrl });
        this.cdr.detectChanges();

        const v = this.registerForm.value;

        const payload: CraftsmanRegistrationDto = {
          userId:        Number(v.userId),
          serviceType:   v.serviceType,
          city:          v.city,
          neighborhood:  v.neighborhood,
          priceRangeMin: Number(v.priceRangeMin),
          priceRangeMax: Number(v.priceRangeMax),
          experience:    Number(v.experience),
          bio:           v.bio,
          nationalIdUrl: v.nationalIdUrl,
        };

        console.log('[Register] payload:', payload);

        this.craftsmanService.register(payload).subscribe({
          next: (regRes) => {
            console.log('[Register] success:', regRes);
            const craftsmanId = regRes?.id;
            if (this.profileImageFile && craftsmanId) {
              this.craftsmanService.uploadProfileImage(craftsmanId, this.profileImageFile).subscribe({
                next: () => {
                  console.log('[Register] profile image uploaded');
                  this.isLoading = false;
                  this.router.navigate(['/craftsman/pending'], { state: { craftsmanData: v } });
                },
                error: (imgErr) => {
                  console.error('[Register] image upload error:', imgErr);
                  this.isLoading = false;
                  this.router.navigate(['/craftsman/pending'], { state: { craftsmanData: v } });
                },
              });
            } else {
              this.isLoading = false;
              this.router.navigate(['/craftsman/pending'], { state: { craftsmanData: v } });
            }
          },
          error: (err) => {
            console.error('[Register] error:', err.status, err.error);
            this.isLoading = false;
            this.errorMessage = this.getErrorMessage(err);
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          },
        });
      },
      error: (err) => {
        console.error('[Register] national ID upload error:', err);
        this.isLoading = false;
        this.errorMessage = 'فشل رفع صورة الهوية. يرجى المحاولة مرة أخرى.';
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      },
    });
  }

  private getErrorMessage(err: any): string {
    switch (err.status) {
      case 400: {
        const msg = err.error?.message ?? err.error?.title ?? err.error?.errors?.join(', ');
        return msg ?? 'البيانات المدخلة غير صحيحة. يرجى مراجعة الحقول والمحاولة مرة أخرى.';
      }
      case 401: return 'انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.';
      case 409: return 'لديك طلب تسجيل سابق قيد المراجعة بالفعل.';
      case 404: return 'المسار غير موجود. تحقق من إعدادات الـ API مع المسؤول.';
      case 0:   return 'لا يمكن الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.';
      default:  return 'حدث خطأ أثناء إرسال البيانات. يرجى المحاولة لاحقاً.';
    }
  }

  goHome(): void {
    this.showSuccessModal = false;
    this.router.navigate(['/home']);
  }
}