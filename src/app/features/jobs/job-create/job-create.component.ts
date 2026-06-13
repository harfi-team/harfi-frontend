import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { LanguageService } from '../../../core/services/language.service';
import { JobsService } from '../jobs.service';
import { CraftsmanService } from '../../craftsman/craftsman.service';
import { CraftsmanDto } from '../../../core/models/craftsman.models';
import { CreateJobDto } from '../../../core/models/job.models';

interface DayOption {
  date: Date;
  dayName: string;
  dayNumber: number;
  monthName: string;
  iso: string;
}

@Component({
  selector: 'app-job-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './job-create.component.html',
  styleUrl: './job-create.component.css',
})
export class JobCreateComponent implements OnInit {
  private jobsService = inject(JobsService);
  private craftsmanService = inject(CraftsmanService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);
  private languageService = inject(LanguageService);

  loading = false;
  craftsman = signal<CraftsmanDto | null>(null);
  craftsmanLoading = signal(false);
  imagePreview = signal<string | null>(null);
  imageFile = signal<File | null>(null);
  uploadingImage = false;

  services = [
    { value: 'سباك', labelKey: 'SERVICES.PLUMBING', icon: 'plumbing' },
    { value: 'كهربائي', labelKey: 'SERVICES.ELECTRICAL', icon: 'electrical_services' },
    { value: 'نجار', labelKey: 'SERVICES.CARPENTRY', icon: 'carpenter' },
    { value: 'نقاش', labelKey: 'SERVICES.PAINTING', icon: 'format_paint' },
    { value: 'تكييف', labelKey: 'SERVICES.AC', icon: 'ac_unit' },
    { value: 'نظافة', labelKey: 'SERVICES.CLEANING', icon: 'cleaning_services' },
    { value: 'نقل', labelKey: 'SERVICES.MOVING', icon: 'local_shipping' },
    { value: 'مكافحة حشرات', labelKey: 'SERVICES.PEST', icon: 'pest_control' },
    { value: 'عزل', labelKey: 'SERVICES.ROOFING', icon: 'roofing' },
  ];

  private slugToArabic: Record<string, string> = {
    plumbing: 'سباك',
    electrical: 'كهربائي',
    carpentry: 'نجار',
    painting: 'نقاش',
    ac: 'تكييف',
    cleaning: 'نظافة',
    moving: 'نقل',
    pest: 'مكافحة حشرات',
    roofing: 'عزل',
  };

  days: DayOption[] = [];
  timeSlots = [
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
  ];

  selectedDay = signal<string>('');
  selectedTime = signal<string>('');

  form = new FormGroup({
    service: new FormControl('سباك', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10)],
    }),
    city: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    address: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    street: new FormControl('', { nonNullable: true }),
    craftsmanId: new FormControl('', { nonNullable: true }),
  });

  get isArabic(): boolean {
    return this.languageService.current() === 'ar';
  }

  get selectedServiceIcon(): string {
    const svc = this.services.find((s) => s.value === this.form.controls.service.value);
    return svc?.icon ?? 'handyman';
  }

  get selectedServiceLabel(): string {
    const svc = this.services.find((s) => s.value === this.form.controls.service.value);
    return svc?.labelKey ?? 'SERVICES.OTHER';
  }

 get filteredServices() {
  const c = this.craftsman();
  if (!c) return this.services; // no craftsman yet → show all

  const rawServices = c.services || [];

  const arabicFromDirect = rawServices.filter(s =>
    this.services.some(svc => svc.value === s)
  );

  const arabicFromSlug = rawServices
    .map(slug => this.slugToArabic[slug.toLowerCase()])
    .filter(Boolean);

  const combined = [...new Set([...arabicFromDirect, ...arabicFromSlug])];

  return this.services.filter(s => combined.includes(s.value)); // ← no fallback
}

  get visitFee(): string {
    const c = this.craftsman();
    if (c && c.priceMin) return `${c.priceMin}`;
    return '50';
  }

  ngOnInit(): void {
    this.generateDays();

    const craftsmanId = this.route.snapshot.queryParamMap.get('craftsmanId');
    const craftsmanName = this.route.snapshot.queryParamMap.get('craftsmanName');
    const service = this.route.snapshot.queryParamMap.get('service');

    if (craftsmanId) {
      this.form.controls.craftsmanId.setValue(craftsmanId);
      this.loadCraftsman(craftsmanId);
    }

    if (service) {
      const arabicValue = this.slugToArabic[service] ?? service;
      if (this.services.some((s) => s.value === arabicValue)) {
        this.form.controls.service.setValue(arabicValue);
      }
    }
  }

  private generateDays(): void {
    const locale = this.isArabic ? 'ar-EG' : 'en-US';
    const today = new Date();
    this.days = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      this.days.push({
        date,
        dayName: date.toLocaleDateString(locale, { weekday: 'short' }),
        dayNumber: date.getDate(),
        monthName: date.toLocaleDateString(locale, { month: 'short' }),
        iso: date.toISOString().split('T')[0],
      });
    }
  }

  private loadCraftsman(id: string): void {
    this.craftsmanLoading.set(true);
    this.craftsmanService.getCraftsman(id).subscribe({
      next: (c) => {
        this.craftsman.set(c);
        this.craftsmanLoading.set(false);

        // Ensure the selected service is one of the craftsman's services
        const available = this.filteredServices;
        const current = this.form.controls.service.value;
        if (available.length > 0 && !available.some(s => s.value === current)) {
          this.form.controls.service.setValue(available[0].value);
        }
      },
      error: () => this.craftsmanLoading.set(false),
    });
  }

  selectDay(day: DayOption): void {
    this.selectedDay.set(day.iso);
  }

  selectTime(time: string): void {
    this.selectedTime.set(time);
  }

  onImageDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) {
      this.setImage(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.setImage(file);
    }
  }

  private setImage(file: File): void {
    this.imageFile.set(file);
    const reader = new FileReader();
    reader.onload = () => this.imagePreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.imageFile.set(null);
    this.imagePreview.set(null);
  }

  clearCraftsman(): void {
    this.form.controls.craftsmanId.setValue('');
    this.craftsman.set(null);
  }

  getStars(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => (i < Math.round(rating) ? 1 : 0));
  }

  getServiceName(craftsman: CraftsmanDto): string {
    const isArabic = this.languageService.current() === 'ar';
    if (isArabic && craftsman.serviceNameAr) {
      return craftsman.serviceNameAr;
    }
    if (!isArabic && craftsman.serviceNameEn) {
      return craftsman.serviceNameEn;
    }
    return craftsman.specialty;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const raw = this.form.getRawValue();

    let preferredDate: string | null = null;
    if (this.selectedDay()) {
      preferredDate = this.selectedDay();
      if (this.selectedTime()) {
        preferredDate += `T${this.selectedTime()}:00`;
      }
    }

    const body: CreateJobDto = {
      service: raw.service,
      description: raw.description,
      city: raw.city,
      address: raw.street ? `${raw.address}, ${raw.street}` : raw.address,
      preferredDate,
      craftsmanId: raw.craftsmanId.trim() ? raw.craftsmanId : null,
      problemDescription: raw.description,
      problemImageUrl: null,
    };

    if (this.imageFile()) {
      this.uploadingImage = true;
      this.jobsService.uploadJobImage(this.imageFile()!).subscribe({
        next: (res) => {
          body.problemImageUrl = res.url;
          this.createJob(body);
        },
        error: () => {
          this.createJob(body);
        },
      });
    } else {
      this.createJob(body);
    }
  }

  private createJob(body: CreateJobDto): void {
    this.jobsService.createJob(body).subscribe({
      next: () => {
        this.errorHandler.success(this.translate.instant('JOBS.SUCCESS_CREATED'));
        this.router.navigate(['/jobs']);
      },
      error: (error) => {
        this.errorHandler.handle(error);
        this.loading = false;
        this.uploadingImage = false;
      },
    });
  }
}
