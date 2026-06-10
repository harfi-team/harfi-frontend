import { Component, inject, OnInit, ChangeDetectorRef, ApplicationRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { UserService } from '../user.service';
import { TokenService } from '../../../core/services/token.service';
import { UserProfileDto } from '../../../core/models/user.models';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-user-profile',
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, SpinnerComponent],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  private userService = inject(UserService);
  private tokenSvc    = inject(TokenService);
  private route       = inject(ActivatedRoute);
  private cdr         = inject(ChangeDetectorRef);
  private appRef      = inject(ApplicationRef);

  profile: UserProfileDto | null = null;
  loading  = true;
  saving   = false;
  uploading = false;
  success  = false;
  errorMessage = '';
  userId!: number;

  form = new FormGroup({
    name:  new FormControl('', [Validators.required, Validators.maxLength(100)]),
    phone: new FormControl('', [Validators.pattern(/^[0-9+]{10,15}$/)]),
    profileImageUrl: new FormControl('')
  });

  ngOnInit(): void {
    this.userId = +this.route.snapshot.paramMap.get('id')!;
    const currentId = this.tokenSvc.getUser()?.id;
    if (currentId && this.userId !== currentId) {
      this.errorMessage = 'يمكنك فقط تعديل ملفك الشخصي';
      this.loading = false;
      return;
    }
    this.loadProfile();
  }

  loadProfile(): void {
    this.userService.getProfile(this.userId).subscribe({
      next: data => {
        this.profile = data;
        this.form.patchValue({
          name:  data.name,
          phone: data.phone ?? '',
          profileImageUrl: data.profileImageUrl ?? ''
        });
        this.loading = false;
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {
        this.loading = false;
        setTimeout(() => this.cdr.detectChanges());
      }
    });
  }

  getInitials(): string {
    return this.profile?.name?.charAt(0)?.toUpperCase() || '?';
  }

  getImageUrl(path: string | null): string {
    if (!path) return 'assets/images/default-avatar.png';
    if (path.startsWith('http')) return path;
    return `${environment.apiBaseUrl.replace('/api', '')}${path}`;
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    this.uploading = true;
    this.userService.uploadProfileImage(this.userId, file).subscribe({
      next: res => {
        this.profile!.profileImageUrl = res.url;
        this.form.patchValue({ profileImageUrl: res.url });
        this.uploading = false;
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {
        this.uploading = false;
        this.errorMessage = 'فشل تحميل الصورة. حاول مرة أخرى.';
        setTimeout(() => this.cdr.detectChanges());
      }
    });
  }

  save(): void {
    if (this.form.invalid || this.saving) return;

    this.saving = true;
    this.userService.updateProfile(this.userId, {
      name:  this.form.value.name!,
      phone: this.form.value.phone || null,
      profileImageUrl: this.form.value.profileImageUrl || null
    }).subscribe({
      next: data => {
        const newName = this.form.value.name!;
        this.profile = { ...this.profile!, ...data, name: newName };
        const u = this.tokenSvc.getUser();
        if (u) {
          this.tokenSvc.setUser({ ...u, name: newName });
        }
        this.saving  = false;
        this.success = true;
        setTimeout(() => {
          this.cdr.detectChanges();
          this.appRef.tick();
        });
        setTimeout(() => this.success = false, 3000);
      },
      error: () => {
        this.saving = false;
        this.errorMessage = 'فشل تحديث الملف الشخصي. حاول مرة أخرى.';
        setTimeout(() => this.cdr.detectChanges());
      }
    });
  }
}