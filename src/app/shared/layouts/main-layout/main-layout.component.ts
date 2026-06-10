import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { SideNavComponent } from '../../components/side-nav/side-nav.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, SideNavComponent, TranslateModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent {
  private router = inject(Router);

  pageTitle = signal('NAV.HOME');
  isAdminRoute = signal(false);
  isAiRoute = signal(false);
  mobileNavOpen = signal(false);

  constructor() {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        map(() => {
          const url = this.router.url;
          if (url.includes('/admin/dashboard'))
            return { key: 'ADMIN.DASHBOARD', admin: true, ai: false };
          if (url.includes('/admin/craftsmen'))
            return { key: 'ADMIN.MANAGE_CRAFTSMEN', admin: true, ai: false };
          if (url.includes('/admin/customers'))
            return { key: 'ADMIN.MANAGE_CUSTOMERS', admin: true, ai: false };
          if (url.includes('/admin/jobs'))
            return { key: 'ADMIN.MANAGE_JOBS', admin: true, ai: false };
          if (url.includes('/admin/reviews'))
            return { key: 'ADMIN.REVIEWS', admin: true, ai: false };
          if (url.includes('/admin/settings'))
            return { key: 'ADMIN.SETTINGS', admin: true, ai: false };
          if (url.includes('/admin')) return { key: 'ADMIN.DASHBOARD', admin: true, ai: false };
          if (url.includes('/home')) return { key: 'NAV.HOME', admin: false, ai: false };
          if (url.includes('/chat')) return { key: 'NAV.CHAT', admin: false, ai: false };
          if (url.includes('/craftsmen')) return { key: 'NAV.SEARCH', admin: false, ai: false };
          if (url.includes('/jobs')) return { key: 'NAV.BOOKINGS', admin: false, ai: false };
          if (url.includes('/notifications'))
            return { key: 'NOTIFICATIONS', admin: false, ai: false };
          if (url.includes('/user')) return { key: 'NAV.PROFILE', admin: false, ai: false };
          if (url.includes('/ai')) return { key: 'AI_ASSISTANT', admin: false, ai: true };
          return { key: 'NAV.HOME', admin: false, ai: false };
        }),
        takeUntilDestroyed(),
      )
      .subscribe(({ key, admin, ai }) => {
        this.pageTitle.set(key);
        this.isAdminRoute.set(admin);
        this.isAiRoute.set(ai);
        this.mobileNavOpen.set(false);
      });
  }

  toggleMobileNav(): void {
    this.mobileNavOpen.update(v => !v);
  }

  closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }
}
