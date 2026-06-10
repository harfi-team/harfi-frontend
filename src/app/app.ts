import { Component, HostListener, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { LanguageService } from './core/services/language.service';
import { ThemeService } from './core/services/theme.service';
import { RealtimeNotificationOrchestratorService } from './core/services/realtime-notification-orchestrator.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  template: `<app-toast /><router-outlet />`,
  styleUrl: './app.css',
})
export class App implements OnInit {
  private languageService = inject(LanguageService);
  private themeService = inject(ThemeService);
  private realtime = inject(RealtimeNotificationOrchestratorService);


  ngOnInit(): void {
    this.languageService.current();
    this.themeService.current();
    this.realtime.start();
  }
  @HostListener('document:click')
  onDocumentClick(): void {
  this.realtime.unlockAudio();
}
}
