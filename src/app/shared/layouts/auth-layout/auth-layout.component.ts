import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ThemeService } from '../../../core/services/theme.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, TranslatePipe],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.css',
})
export class AuthLayoutComponent {
  theme = inject(ThemeService);
  language = inject(LanguageService);
  router = inject(Router);

  get isRegisterPage(): boolean {
    return this.router.url.includes('/register');
  }
}
