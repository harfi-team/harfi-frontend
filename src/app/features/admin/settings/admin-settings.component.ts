import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService } from '../admin.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { LanguageService } from '@core/services/language.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ServiceType, City, FeatureFlag } from '@core/models/admin.models';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ConfirmDialogComponent],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.css',
})
export class AdminSettingsComponent {
  private adminService = inject(AdminService);
  private errorHandler = inject(ErrorHandlerService);
  protected languageService = inject(LanguageService);

  activeTab = signal<'service-types' | 'cities' | 'feature-flags'>('service-types');

  serviceTypes = signal<ServiceType[]>([]);
  cities = signal<City[]>([]);
  featureFlags = signal<FeatureFlag[]>([]);

  loadingServiceTypes = signal(false);
  loadingCities = signal(false);
  loadingFlags = signal(false);

  showModal = signal(false);
  modalType = signal<'service-type' | 'city'>('service-type');
  isEditing = signal(false);
  editId = signal<number | null>(null);

  formNameAr = signal('');
  formNameEn = signal('');
  formIcon = signal('');
  formGovernorate = signal('');
  formIsActive = signal(true);
  submitting = signal(false);

  showDeleteConfirm = signal(false);
  deleteType = signal<'service-type' | 'city'>('service-type');
  deleteId = signal<number | null>(null);

  togglingFlags = signal<Set<string>>(new Set());

  constructor() {
    this.loadServiceTypes();
  }

  setTab(tab: 'service-types' | 'cities' | 'feature-flags'): void {
    this.activeTab.set(tab);
    if (tab === 'service-types') {
      if (this.serviceTypes().length === 0) this.loadServiceTypes();
    } else if (tab === 'cities') {
      if (this.cities().length === 0) this.loadCities();
    } else {
      if (this.featureFlags().length === 0) this.loadFeatureFlags();
    }
  }

  loadServiceTypes(): void {
    this.loadingServiceTypes.set(true);
    this.adminService.getServiceTypes().subscribe({
      next: (data) => { this.serviceTypes.set(data); this.loadingServiceTypes.set(false); },
      error: () => this.loadingServiceTypes.set(false),
    });
  }

  loadCities(): void {
    this.loadingCities.set(true);
    this.adminService.getCities().subscribe({
      next: (data) => { this.cities.set(data); this.loadingCities.set(false); },
      error: () => this.loadingCities.set(false),
    });
  }

  loadFeatureFlags(): void {
    this.loadingFlags.set(true);
    this.adminService.getFeatureFlags().subscribe({
      next: (data) => { this.featureFlags.set(data); this.loadingFlags.set(false); },
      error: () => this.loadingFlags.set(false),
    });
  }

  openAddModal(type: 'service-type' | 'city'): void {
    this.modalType.set(type);
    this.isEditing.set(false);
    this.editId.set(null);
    this.formNameAr.set('');
    this.formNameEn.set('');
    this.formIcon.set('');
    this.formGovernorate.set('');
    this.formIsActive.set(true);
    this.submitting.set(false);
    this.showModal.set(true);
  }

  openEditModal(type: 'service-type' | 'city', item: ServiceType | City): void {
    this.modalType.set(type);
    this.isEditing.set(true);
    this.editId.set(item.id);
    this.formNameAr.set(item.nameAr);
    this.formNameEn.set(item.nameEn);
    this.formIcon.set('icon' in item ? (item as ServiceType).icon || '' : '');
    this.formGovernorate.set('governorate' in item ? (item as City).governorate || '' : '');
    this.formIsActive.set(item.isActive);
    this.submitting.set(false);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  submitForm(): void {
    if (!this.formNameAr().trim() || !this.formNameEn().trim()) return;
    this.submitting.set(true);

    if (this.modalType() === 'service-type') {
      const dto: Omit<ServiceType, 'id'> = {
        nameAr: this.formNameAr().trim(),
        nameEn: this.formNameEn().trim(),
        icon: this.formIcon().trim() || null,
        isActive: this.formIsActive(),
      };

      const request = this.isEditing()
        ? this.adminService.updateServiceType(this.editId()!, dto)
        : this.adminService.createServiceType(dto);

      request.subscribe({
        next: () => {
          this.errorHandler.success(this.isEditing() ? 'تم تحديث نوع الخدمة' : 'تم إضافة نوع الخدمة');
          this.closeModal();
          this.loadServiceTypes();
        },
        error: () => this.submitting.set(false),
      });
    } else {
      const dto: Omit<City, 'id'> = {
        nameAr: this.formNameAr().trim(),
        nameEn: this.formNameEn().trim(),
        governorate: this.formGovernorate().trim() || null,
        isActive: this.formIsActive(),
      };

      const request = this.isEditing()
        ? this.adminService.updateCity(this.editId()!, dto)
        : this.adminService.createCity(dto);

      request.subscribe({
        next: () => {
          this.errorHandler.success(this.isEditing() ? 'تم تحديث المدينة' : 'تم إضافة المدينة');
          this.closeModal();
          this.loadCities();
        },
        error: () => this.submitting.set(false),
      });
    }
  }

  confirmDelete(type: 'service-type' | 'city', id: number): void {
    this.deleteType.set(type);
    this.deleteId.set(id);
    this.showDeleteConfirm.set(true);
  }

  onDeleteConfirmed(): void {
    const id = this.deleteId()!;
    const request = this.deleteType() === 'service-type'
      ? this.adminService.deleteServiceType(id)
      : this.adminService.deleteCity(id);

    request.subscribe({
      next: () => {
        this.errorHandler.success(this.deleteType() === 'service-type' ? 'تم حذف نوع الخدمة' : 'تم حذف المدينة');
        this.showDeleteConfirm.set(false);
        if (this.deleteType() === 'service-type') this.loadServiceTypes();
        else this.loadCities();
      },
      error: () => this.showDeleteConfirm.set(false),
    });
  }

  onDeleteDismissed(): void {
    this.showDeleteConfirm.set(false);
  }

  toggleFeature(key: string, currentValue: boolean): void {
    this.togglingFlags.update(s => { const ns = new Set(s); ns.add(key); return ns; });

    this.featureFlags.update(flags =>
      flags.map(f => f.key === key ? { ...f, isEnabled: !currentValue } : f)
    );

    this.adminService.toggleFeatureFlag(key, !currentValue).subscribe({
      next: () => {
        this.togglingFlags.update(s => { const ns = new Set(s); ns.delete(key); return ns; });
      },
      error: () => {
        this.featureFlags.update(flags =>
          flags.map(f => f.key === key ? { ...f, isEnabled: currentValue } : f)
        );
        this.togglingFlags.update(s => { const ns = new Set(s); ns.delete(key); return ns; });
      },
    });
  }
}
