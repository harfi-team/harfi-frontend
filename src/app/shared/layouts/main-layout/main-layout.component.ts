import { Component, inject, signal ,computed} from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { SideNavComponent } from '../../components/side-nav/side-nav.component';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationsService } from '../../../features/notifications/notifications.service';
import { ChatService } from '../../../features/chat/chat.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, SideNavComponent, TranslateModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent {
  private router = inject(Router);
  private auth = inject(AuthService);
  private notificationsService = inject(NotificationsService);
  private chatService = inject(ChatService);

  pageTitle = signal('NAV.HOME');
  isAdminRoute = signal(false);
  isAiRoute = signal(false);
  isRegisterPage = signal(false);
  mobileNavOpen = signal(false);
  currentUrl = signal(this.router.url);
  readonly unreadCount = this.notificationsService.unreadCount;

  readonly isCustomer = computed(() => this.auth.getRole() === 'customer');

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
            return { key: 'NOTIFICATIONS.TITLE', admin: false, ai: false };

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
        this.isRegisterPage.set(this.router.url.includes('register'));
        this.currentUrl.set(this.router.url);
        this.mobileNavOpen.set(false);
      });

    this.loadUnreadCount();
  }


    toggleMobileNav(): void {
    this.mobileNavOpen.update(v => !v);
  }

  goToNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  goToProfile(): void {
    const id = this.auth.getUserId();
    if (!id) return;
    this.router.navigate(['/user/profile', id]);
  }

  closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }

  private loadUnreadCount(): void {
    if (!this.auth.isLoggedIn()) return;

    this.notificationsService.getUnreadCount().subscribe({
      next: (res) => this.notificationsService.setUnreadCount(res.unreadCount),
      error: () => this.notificationsService.setUnreadCount(0),
    });

    this.chatService.getConversations().subscribe({
      next: conversations => this.chatService.updateTotalUnread(conversations),
    });
  }
}

