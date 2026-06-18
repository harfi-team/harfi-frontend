import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService } from '../admin.service';
import { FeatureFlag } from '@core/models/admin.models';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.css',
})
export class AdminSettingsComponent {
  private adminService = inject(AdminService);

  featureFlags = signal<FeatureFlag[]>([]);
  loadingFlags = signal(false);
  togglingFlags = signal<Set<string>>(new Set());

  constructor() {
    this.loadFeatureFlags();
  }

  loadFeatureFlags(): void {
    this.loadingFlags.set(true);
    this.adminService.getFeatureFlags().subscribe({
      next: (data) => { this.featureFlags.set(data); this.loadingFlags.set(false); },
      error: () => this.loadingFlags.set(false),
    });
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
