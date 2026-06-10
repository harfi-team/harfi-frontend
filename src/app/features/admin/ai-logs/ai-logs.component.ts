import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { AdminService } from '../admin.service';
import { AiLog, AiAnalytics } from '@core/models/admin.models';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { environment } from '@env/environment';
import { finalize } from 'rxjs/operators';

interface AiLogGroup {
  sessionId: string;
  userName: string;
  messages: AiLog[];
  createdAt: string;
}

@Component({
  selector: 'app-ai-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, DecimalPipe],
  templateUrl: './ai-logs.component.html',
  styleUrl: './ai-logs.component.css',
})
export class AiLogsComponent {
  private adminService = inject(AdminService);
  private errorHandler = inject(ErrorHandlerService);
  private http = inject(HttpClient);

  analytics = signal<AiAnalytics | null>(null);
  logs = signal<AiLog[]>([]);
  loading = signal(true);
  page = signal(1);
  total = signal(0);
  totalPages = signal(0);
  pageSize = 20;
  fromDate = signal('');
  toDate = signal('');
  expandedSessions = signal<Set<string>>(new Set());
  syncingCraftsmen = signal(false);
  syncingJobs = signal(false);

  constructor() {
    this.loadAnalytics();
    this.loadLogs();
    this.loadVectorsCount();
  }

  groupedLogs = computed<AiLogGroup[]>(() => {
    const map = new Map<string, AiLogGroup>();
    for (const log of this.logs()) {
      if (!map.has(log.sessionId)) {
        map.set(log.sessionId, {
          sessionId: log.sessionId,
          userName: log.userName,
          messages: [],
          createdAt: log.createdAt,
        });
      }
      map.get(log.sessionId)!.messages.push(log);
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  loadAnalytics(): void {
    this.adminService.getAiAnalytics().subscribe({
      next: (data) => this.analytics.set(data),
    });
  }

  loadLogs(): void {
    this.loading.set(true);
    this.adminService
      .getAiLogs(
        this.page(),
        this.pageSize,
        this.fromDate() || undefined,
        this.toDate() || undefined
      )
      .subscribe({
        next: (data) => {
          this.logs.set(data.items);
          this.total.set(data.totalCount);
          this.totalPages.set(data.totalPages);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  clearFilter(): void {
    this.fromDate.set('');
    this.toDate.set('');
    this.page.set(1);
    this.expandedSessions.set(new Set());
    this.loadLogs();
  }

  applyFilter(): void {
    this.page.set(1);
    this.expandedSessions.set(new Set());
    this.loadLogs();
  }

  toggleSession(sessionId: string): void {
    const next = new Set(this.expandedSessions());
    if (next.has(sessionId)) {
      next.delete(sessionId);
    } else {
      next.add(sessionId);
    }
    this.expandedSessions.set(next);
  }

  isExpanded(sessionId: string): boolean {
    return this.expandedSessions().has(sessionId);
  }

  changePage(p: number): void {
    this.page.set(p);
    this.expandedSessions.set(new Set());
    this.loadLogs();
  }

  vectorsTotal = signal<number>(0);
  loadingVectors = signal(false);

  syncCraftsmen(): void {
    this.syncingCraftsmen.set(true);
    this.http
      .post<{ totalCraftsmen: number; totalChunksIndexed: number; message: string }>(
        `${environment.apiBaseUrl}/AI/ingest/craftsmen`, {}
      )
      .pipe(finalize(() => this.syncingCraftsmen.set(false)))
      .subscribe({
        next: (res) => {
          this.errorHandler.success(res.message || `تمت مزامنة ${res.totalCraftsmen} حرفي بنجاح`);
          this.loadAnalytics();
          this.loadVectorsCount();
        },
      });
  }

  syncJobs(): void {
    this.syncingJobs.set(true);
    this.http
      .post<{ indexed: number }>(`${environment.apiBaseUrl}/AI/ingest/jobs`, {})
      .pipe(finalize(() => this.syncingJobs.set(false)))
      .subscribe({
        next: (res) => {
          this.errorHandler.success(`تمت مزامنة ${res.indexed} حل بنجاح`);
          this.loadAnalytics();
          this.loadVectorsCount();
        },
      });
  }

  loadVectorsCount(): void {
    this.loadingVectors.set(true);
    this.http
      .get<{ totalVectors: number }>(`${environment.apiBaseUrl}/AI/vectors/count`)
      .pipe(finalize(() => this.loadingVectors.set(false)))
      .subscribe({
        next: (res) => this.vectorsTotal.set(res.totalVectors),
      });
  }

  formatTokens(count: number): string {
    if (count >= 1_000_000) return (count / 1_000_000).toFixed(1) + 'M';
    if (count >= 1_000) return (count / 1_000).toFixed(1) + 'K';
    return count.toLocaleString();
  }

  truncate(text: string, max = 80): string {
    return text.length > max ? text.slice(0, max) + '…' : text;
  }

  roleColor(role: string): string {
    return role === 'assistant' ? 'role-green' : 'role-blue';
  }

  get startEntry(): number {
    return (this.page() - 1) * this.pageSize + 1;
  }

  get endEntry(): number {
    return Math.min(this.page() * this.pageSize, this.total());
  }
}
