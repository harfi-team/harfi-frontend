import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { switchMap } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { TokenService } from '../../../core/services/token.service';
import { LanguageService } from '../../../core/services/language.service';
import { UserService } from '../../user/user.service';
import { CraftsmanDto, CraftsmanReviewsResponse } from '../../../core/models/craftsman.models';
import { CraftsmanService, UpdateCraftsmanProfileDto } from '../craftsman.service';
import { CraftsmanReviewsComponent } from './craftsman-reviews/craftsman-reviews.component';
import { JobsService } from '../../jobs/jobs.service';
import { JobDto } from '../../../core/models/job.models';

@Component({
  selector: 'app-craftsman-profile',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    CraftsmanReviewsComponent,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './craftsman-profile.component.html',
  styleUrl: './craftsman-profile.component.css',
})
export class CraftsmanProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private craftsmanService = inject(CraftsmanService);
  private auth = inject(AuthService);
  private tokenSvc = inject(TokenService);
  private userService = inject(UserService);
  private languageService = inject(LanguageService);
  private jobsService = inject(JobsService);

  loading = signal(true);
  craftsman = signal<CraftsmanDto | null>(null);
  reviewsSummary = signal<CraftsmanReviewsResponse | null>(null);
  activeTab = signal<'about' | 'portfolio' | 'reviews'>('about');

  // ── Jobs (الأعمال السابقة) ──
  jobs = signal<JobDto[]>([]);
  loadingJobs = signal(false);

  // ── Edit Modal ──
  showEditModal = signal(false);
  editSaving = signal(false);
  editSuccess = signal(false);
  editError = signal('');
  editUploading = signal(false);

  editForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    phone: new FormControl('', [Validators.required, Validators.pattern(/^[0-9+]{10,15}$/)]),
    bio: new FormControl('', [Validators.maxLength(1000)]),
    priceMin: new FormControl<number | null>(null, [Validators.min(0)]),
    priceMax: new FormControl<number | null>(null, [Validators.min(0)]),
  });

  direction = computed(() => this.languageService.current() === 'ar' ? 'rtl' : 'ltr');
  craftsmanId = computed(() => Number(this.route.snapshot.paramMap.get('id') ?? 0));

  // true لو المستخدم customer
  get isCustomer(): boolean {
    return this.auth.getRole() === 'customer';
  }

  // true لو customer، أو craftsman بيبص على بروفايل حد تاني مش بتاعه
  get canBook(): boolean {
    const role = this.auth.getRole();
    if (role === 'customer') return true;
    if (role === 'craftsman') {
      const myCraftsmanId = this.auth.getCraftsmanId();
      const profileId = Number(this.route.snapshot.paramMap.get('id'));
      return myCraftsmanId !== profileId;
    }
    return false;
  }

  // true لو المستخدم customer فقط

  // true لو الـ craftsman بيبص على بروفايله هو
  get isOwnProfile(): boolean {
    const role = this.auth.getRole();
    if (role !== 'craftsman') return false;
    const myCraftsmanId = this.auth.getCraftsmanId();
    const profileId = Number(this.route.snapshot.paramMap.get('id'));
    return myCraftsmanId === profileId;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';

    this.craftsmanService.getCraftsman(id).subscribe({
      next: (data) => {
        this.craftsman.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.craftsman.set(null);
        this.loading.set(false);
      },
    });

    if (id) {
      this.craftsmanService.getCraftsmanReviews(id).subscribe({
        next: (res) => this.reviewsSummary.set(res),
        error: () =>
          this.reviewsSummary.set({
            craftsmanId: Number(id),
            totalReviews: 0,
            averageStars: 0,
            reviews: [],
          }),
      });
    }

    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'reviews') {
      this.activeTab.set('reviews');
    }

    // ── تحميل الأعمال المكتملة — للجميع (حرفي و customer) ──
    if (this.craftsmanId()) {
      this.loadCompletedJobs();
    }
  }

  // ── جلب الطلبات المكتملة للحرفي والـ customer ──
  loadCompletedJobs(): void {
    const id = this.craftsmanId();
    if (!id) return;
    this.loadingJobs.set(true);
    this.jobsService.getCraftsmanJobs(id).subscribe({
      next: (jobs) => {
        const completed = jobs
          .filter((j) => j.status === 'done')
          .sort((a, b) => {
            const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
            const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
            return dateB - dateA;
          });
        this.jobs.set(completed);
        this.loadingJobs.set(false);
      },
      error: (err) => {
        // لو customer يحصل 403 بشكل صحيح نسكت عليها
        // لو customer يحصل خطأ تاني نطبعه في console بس مش نوقف التطبيق
        if (err.status === 403) {
          // 403 = منع قراءة الأعمال — يحصل للـ customer عادي
          // نسكت عليها بسلام
        } else {
          console.warn('Failed to load completed jobs:', err);
        }
        this.jobs.set([]);
        this.loadingJobs.set(false);
      },
    });
  }

  setTab(tab: 'about' | 'portfolio' | 'reviews'): void {
    this.activeTab.set(tab);
    // لو الحد ضغط على portfolio ولسه محملناش الجوبز، نحملهم
    // (سواء كان حرفي أو customer)
    if (tab === 'portfolio' && this.jobs().length === 0 && !this.loadingJobs()) {
      this.loadCompletedJobs();
    }
  }

  assignJob(craftsman: CraftsmanDto): void {
    const service = this.craftsmanService.getPrimaryService(craftsman);
    this.router.navigate(['/jobs/create'], {
      queryParams: {
        craftsmanId: craftsman.id,
        craftsmanName: craftsman.name,
        service: service || undefined,
      },
    });
  }

  // ── فتح الـ Modal ──
  openEditModal(): void {
    const user = this.tokenSvc.getUser();
    const c = this.craftsman();
    this.editForm.patchValue({
      name: user?.name ?? '',
      phone: c?.phone ?? '',
      bio: c?.bio ?? '',
      priceMin: c?.priceMin ?? null,
      priceMax: c?.priceMax ?? null,
    });
    
    this.editError.set('');
    this.editSuccess.set(false);
    this.showEditModal.set(true);

    // 2. نكلم الباك إند نجيب البروفايل الكامل (اللي جواه رقم التليفون)
    const userId = user?.id;
    if (userId) {
      this.userService.getProfile(userId).subscribe({
        next: (profileData: any) => {
          // 3. أول ما الداتا تيجي، نحدث الفورم برقم التليفون الحقيقي
          this.editForm.patchValue({
            name: profileData.name ?? this.editForm.value.name,
            phone: profileData.phone ?? '',
          });
        },
        error: (err) => {
          console.error('فشل في جلب بيانات المستخدم:', err);
        }
      });
    }
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    const userId = this.tokenSvc.getUser()?.id;
    if (!userId) return;

    this.editUploading.set(true);
    this.userService.uploadProfileImage(userId, file).subscribe({
      next: (res) => {
        const current = this.craftsman();
        if (current) this.craftsman.set({ ...current, avatarUrl: res.url });
        this.editUploading.set(false);
      },
      error: () => {
        this.editError.set('CRAFTSMAN_PROFILE.EDIT_UPLOAD_FAILED');
        this.editUploading.set(false);
      },
    });
  }

  saveEdit(): void {
    if (this.editForm.invalid || this.editSaving()) return;
    const userId = this.tokenSvc.getUser()?.id;
    const craftsmanId = this.craftsman()?.id;
    if (!userId || !craftsmanId) return;

    this.editSaving.set(true);

    const userPayload = {
      name: this.editForm.value.name!,
      phone: this.editForm.value.phone!,
      profileImageUrl: this.craftsman()?.avatarUrl ?? null,
    };

    const craftsmanPayload: UpdateCraftsmanProfileDto = {
      fullname: this.editForm.value.name!,
      profileImageUrl: this.craftsman()?.avatarUrl ?? '',
      city: this.craftsman()?.city ?? '',
      neighborhood: this.craftsman()?.neighborhood ?? null,
      priceRangeMin: this.editForm.value.priceMin ?? null,
      priceRangeMax: this.editForm.value.priceMax ?? null,
      experience: this.craftsman()?.experienceYears ?? 0,
      bio: this.editForm.value.bio ?? null,
    };

    this.userService.updateProfile(userId, userPayload).pipe(
      switchMap(() =>
        this.craftsmanService.updateCraftsmanProfile(craftsmanId, craftsmanPayload),
      ),
    ).subscribe({
      next: () => {
        const u = this.tokenSvc.getUser();
        const form = this.editForm.value;
        if (u) this.tokenSvc.setUser({ ...u, name: form.name ?? u.name });
        const current = this.craftsman();
        if (current) {
          this.craftsman.set({
            ...current,
            name: form.name ?? current.name,
            phone: form.phone ?? '',
            bio: form.bio ?? '',
            priceMin: form.priceMin ?? undefined,
            priceMax: form.priceMax ?? undefined,
          });
        }
        this.editSaving.set(false);
        this.editSuccess.set(true);
        setTimeout(() => {
          this.editSuccess.set(false);
          this.closeEditModal();
        }, 1500);
      },
      error: (err) => {
        console.error('Save failed:', err);
        this.editError.set('CRAFTSMAN_PROFILE.EDIT_FAILED');
        this.editSaving.set(false);
      },
    });
  }

  getPriceRange(craftsman: CraftsmanDto): string {
    return this.craftsmanService.getPriceRange(craftsman);
  }

  getServiceLabel(craftsman: CraftsmanDto): string {
    const service = this.craftsmanService.getPrimaryService(craftsman);
    return service ? `SERVICES.${service.toUpperCase()}` : this.getServiceName(craftsman);
  }

  getImageUrl(path: string | null | undefined): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${environment.apiBaseUrl.replace('/api', '')}${path}`;
  }

  getServiceName(craftsman: CraftsmanDto): string {
    const isArabic = this.languageService.current() === 'ar';
    if (isArabic && craftsman.serviceNameAr) return craftsman.serviceNameAr;
    if (!isArabic && craftsman.serviceNameEn) return craftsman.serviceNameEn;
    return craftsman.specialty;
  }

  displayRating(craftsman: CraftsmanDto): number {
    const summary = this.reviewsSummary();
    if (summary && summary.totalReviews > 0) return summary.averageStars;
    return craftsman.rating;
  }

  displayReviewsCount(craftsman: CraftsmanDto): number {
    const summary = this.reviewsSummary();
    if (summary) return summary.totalReviews;
    return craftsman.reviewsCount;
  }

  // // تحويل نص الخطوات لمصفوفة سطور — يدعم \n أو "1. " أو "- "
  // getSolutionLines(text: string): string[] {
  //   return text
  //     .split(/\n|(?=\d+[.\-)\]\s])|(?=-\s)/)
  //     .map(l => l.trim())
  //     .filter(l => l.length > 0);
  // }
  getSolutionLines(text: string): string[] {
  const rawLines = text
    .split(/\n|(?=\d+[.\-)\]\s])|(?=-\s)/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  return rawLines.map(line => {
    // إزالة أي بداية مثل "1." أو "1.1." أو "- " أو "1) "
    return line.replace(/^[\d.]+[\s.)\-]*\s*/, '').trim();
  });
}
}