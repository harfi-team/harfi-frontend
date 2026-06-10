import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { JobAction, JobDto, JobStatus } from '../../../core/models/job.models';
import { JobsService } from '../jobs.service';
import { CraftsmanService } from '../../craftsman/craftsman.service';
import { environment } from '../../../../environments/environment';

type JobFilterTab = 'all' | JobStatus;

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './job-list.component.html',
  styleUrl: './job-list.component.css',
})
export class JobListComponent implements OnInit {
  private jobsService = inject(JobsService);
  private craftsmanService = inject(CraftsmanService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);

  jobs = signal<JobDto[]>([]);
  loading = signal(true);
  activeTab = signal<JobFilterTab>('all');

  readonly filterTabs: Array<{ value: JobFilterTab; labelKey: string }> = [
    { value: 'all', labelKey: 'JOBS.FILTER_ALL' },
    { value: 'open', labelKey: 'JOBS.FILTER_OPEN' },
    { value: 'in-progress', labelKey: 'JOBS.FILTER_IN_PROGRESS' },
    { value: 'done', labelKey: 'JOBS.FILTER_DONE' },
    { value: 'rejected', labelKey: 'JOBS.FILTER_REJECTED' },
  ];

  readonly isCustomer = computed(() => this.authService.getRole() === 'customer');
  readonly isCraftsman = computed(() => this.authService.getRole() === 'craftsman');
  readonly visibleJobs = computed(() => {
    const jobs = this.jobs();
    const tab = this.activeTab();
    return tab === 'all' ? jobs : jobs.filter((job) => job.status === tab);
  });
  readonly counts = computed(() => {
    const jobs = this.jobs();
    return {
      all: jobs.length,
      open: jobs.filter((job) => job.status === 'open').length,
      progress: jobs.filter((job) => job.status === 'in-progress').length,
      done: jobs.filter((job) => job.status === 'done').length,
      rejected: jobs.filter((job) => job.status === 'rejected').length,
    };
  });

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    const id = this.isCraftsman()
      ? this.authService.getCraftsmanId()
      : this.authService.getUserId();
    if (!id) {
      this.jobs.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    const request = this.isCraftsman()
      ? this.jobsService.getCraftsmanJobs(id)
      : this.jobsService.getCustomerJobs(id);

    request.subscribe({
      next: (items) => {
        const sorted = [...items].sort(
          (a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime(),
        );
        this.jobs.set(sorted);
        this.loading.set(false);

        // Enrich jobs with craftsman names since DB only stores craftsmanId
        if (this.isCustomer()) {
          this.enrichWithCraftsmanNames(sorted);
        }
      },
      error: (error) => {
        this.errorHandler.handle(error);
        this.jobs.set([]);
        this.loading.set(false);
      },
    });
  }

  private enrichWithCraftsmanNames(jobs: JobDto[]): void {
    const jobsNeedingName = jobs.filter(j => j.craftsmanId && !j.craftsmanName);

    jobsNeedingName.forEach(job => {
      this.craftsmanService.getCraftsman(String(job.craftsmanId!)).subscribe({
        next: (craftsman) => {
          if (!craftsman?.name) {
            return;
          }
          this.jobs.update(current =>
            current.map(j =>
              j.id === job.id ? { ...j, craftsmanName: craftsman.name } : j
            )
          );
        },
        error: () => {}, // silently ignore — name just stays null
      });
    });
  }

  setTab(tab: JobFilterTab): void {
    this.activeTab.set(tab);
  }

  createJob(): void {
    this.router.navigate(['/jobs/create']);
  }

  performAction(jobId: string, action: JobAction): void {
    this.jobsService.performAction(jobId, action).subscribe({
      next: () => {
        this.errorHandler.success(this.translate.instant(this.getActionSuccessKey(action)));
        this.loadJobs();
      },
      error: (error) => this.errorHandler.handle(error),
    });
  }

  getActionSuccessKey(action: JobAction): string {
    switch (action) {
      case 'accept':
        return 'JOBS.SUCCESS_ACCEPTED';
      case 'reject':
        return 'JOBS.SUCCESS_REJECTED';
      case 'complete':
        return 'JOBS.SUCCESS_COMPLETED';
      default:
        throw new Error('Unsupported job action');
    }
  }

  getStatusLabelKey(status: JobStatus): string {
    switch (status) {
      case 'open':
        return 'JOBS.STATUS_OPEN';
      case 'in-progress':
        return 'JOBS.STATUS_IN_PROGRESS';
      case 'done':
        return 'JOBS.STATUS_DONE';
      case 'rejected':
        return 'JOBS.STATUS_REJECTED';
      default:
        throw new Error('Unsupported job status');
    }
  }

  getStatusClass(status: JobStatus): string {
    return `job-status job-status--${status}`;
  }

  getServiceLabel(service: string): string {
    if (!service) return 'SERVICES.OTHER';
    const normalized = service.toLowerCase();
    const map: Record<string, string> = {
      plumbing: 'SERVICES.PLUMBING',
      electrical: 'SERVICES.ELECTRICAL',
      carpentry: 'SERVICES.CARPENTRY',
      painting: 'SERVICES.PAINTING',
      ac: 'SERVICES.AC',
      cleaning: 'SERVICES.CLEANING',
      moving: 'SERVICES.MOVING',
      pest: 'SERVICES.PEST',
      roofing: 'SERVICES.ROOFING',
      سباك: 'SERVICES.PLUMBING',
      كهربائي: 'SERVICES.ELECTRICAL',
      نجار: 'SERVICES.CARPENTRY',
      نقاش: 'SERVICES.PAINTING',
      تكييف: 'SERVICES.AC',
      نظافة: 'SERVICES.CLEANING',
      نقل: 'SERVICES.MOVING',
      'مكافحة حشرات': 'SERVICES.PEST',
    };

    return map[normalized] ?? map[service] ?? service;
  }

  getAssignedLabel(job: JobDto): string {
    if (this.isCraftsman()) {
      return job.customerName ?? this.translate.instant('JOBS.CUSTOMER_NAME');
    }

    return job.craftsmanName ?? this.translate.instant('JOBS.CRAFTSMAN_NAME');
  }

  canAccept(job: JobDto): boolean {
    return this.isCraftsman() && job.status === 'open';
  }

  canReject(job: JobDto): boolean {
    return this.isCraftsman() && job.status === 'open';
  }

  canComplete(job: JobDto): boolean {
    return this.isCraftsman() && job.status === 'in-progress';
  }

  trackByJobId(_: number, job: JobDto): string {
    return job.id;
  }

  getServiceIcon(service: string): string {
    if (!service) return 'handyman';
    const iconMap: Record<string, string> = {
      سباك: 'plumbing',
      كهربائي: 'electrical_services',
      نجار: 'carpenter',
      نقاش: 'format_paint',
      تكييف: 'ac_unit',
      نظافة: 'cleaning_services',
      نقل: 'local_shipping',
      'مكافحة حشرات': 'pest_control',
      plumbing: 'plumbing',
      electrical: 'electrical_services',
      carpentry: 'carpenter',
      painting: 'format_paint',
      ac: 'ac_unit',
      cleaning: 'cleaning_services',
      moving: 'local_shipping',
      pest: 'pest_control',
      roofing: 'roofing',
    };
    return iconMap[service.toLowerCase()] ?? iconMap[service] ?? 'handyman';
  }

  getImageUrl(path: string): string {
    const serverBase = environment.apiBaseUrl.replace('/api', '');
    return `${serverBase}${path}`;
  }
}