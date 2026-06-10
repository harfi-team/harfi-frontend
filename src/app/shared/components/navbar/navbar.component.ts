import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { LanguageService } from '../../../core/services/language.service';
import { NotificationsService } from '../../../features/notifications/notifications.service';
import { RealtimeNotificationOrchestratorService } from '../../../core/services/realtime-notification-orchestrator.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  language = inject(LanguageService);
  private router = inject(Router);
  private notifService = inject(NotificationsService);
  private realtimeNotifications = inject(RealtimeNotificationOrchestratorService);

  readonly unreadCount = this.notifService.unreadCount;


  constructor() {
    this.realtimeNotifications.start();
  }

  openNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  async onLogout(): Promise<void> {
    await this.realtimeNotifications.stop();
    this.auth.logout();
  }
}
