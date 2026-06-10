import { Component, inject, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { LanguageService } from '../../../core/services/language.service';

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

  showAddButton = input<boolean>(false);

  get isAdmin(): boolean {
    return this.auth.getRole() === 'admin';
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

  navigateToAddCraftsman(): void {
    // Removed - no backend endpoint exists
  }
}
