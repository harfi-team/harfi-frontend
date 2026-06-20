import { Component, inject, input, output, HostBinding } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { LanguageService } from '../../../core/services/language.service';
import { NotificationsService } from '../../../features/notifications/notifications.service';
import { ChatService } from '../../../features/chat/chat.service';

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.css',
})
export class SideNavComponent {
  auth = inject(AuthService);
  router = inject(Router);
  themeService = inject(ThemeService);
  languageService = inject(LanguageService);
  private notifService = inject(NotificationsService);
  private chatService = inject(ChatService);

  readonly unreadCount = this.notifService.unreadCount;
  readonly chatUnreadCount = this.chatService.totalUnreadCount;

  showAddButton = input<boolean>(false);
  isDrawerOpen = input<boolean>(false);
  drawerClosed = output<void>();

  @HostBinding('class.drawer-open') get drawerOpenClass(): boolean {
    return this.isDrawerOpen();
  }

  get isAdmin(): boolean {
    return this.auth.getRole() === 'admin';
  }
  get isCraftsman(): boolean {
    return this.auth.getRole() === 'craftsman';
  }
  get isCustomer(): boolean {
    return this.auth.getRole() === 'customer';
  }

  get isDark(): boolean {
    return this.themeService.current() === 'dark';
  }
  get isArabic(): boolean {
    return this.languageService.current() === 'ar';
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }
  toggleLanguage(): void {
    this.languageService.switchTo(this.languageService.current() === 'ar' ? 'en' : 'ar');
  }

  closeDrawer(): void {
    this.drawerClosed.emit();
  }

  navigateToAddCraftsman(): void {
    // Removed - no backend endpoint exists
  }



get isAiChatPage(): boolean {
    return this.router.url.includes('/ai');
  }


  
  get craftsmanId(): number | null {
  return this.auth.getCraftsmanId(); // 👈 اسم الدالة اللي بتجيب آيدي الحرفي من السيرفيس
  }
}
