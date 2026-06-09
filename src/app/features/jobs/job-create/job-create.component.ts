import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { JobsService } from '../jobs.service';
import { CreateJobDto } from '@core/models/job.models';

@Component({
  selector: 'app-job-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './job-create.component.html',
  styleUrl: './job-create.component.css',
})
export class JobCreateComponent implements OnInit {
  private jobsService = inject(JobsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);

  loading = false;
  craftsmanName = '';

  services = [
    { value: 'plumbing', labelKey: 'SERVICES.PLUMBING' },
    { value: 'electrical', labelKey: 'SERVICES.ELECTRICAL' },
    { value: 'carpentry', labelKey: 'SERVICES.CARPENTRY' },
    { value: 'painting', labelKey: 'SERVICES.PAINTING' },
    { value: 'ac', labelKey: 'SERVICES.AC' },
    { value: 'cleaning', labelKey: 'SERVICES.CLEANING' },
    { value: 'moving', labelKey: 'SERVICES.MOVING' },
    { value: 'pest', labelKey: 'SERVICES.PEST' },
    { value: 'roofing', labelKey: 'SERVICES.ROOFING' },
  ];

  form = new FormGroup({
    service: new FormControl('plumbing', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(20)] }),
    city: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    address: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    preferredDate: new FormControl('', { nonNullable: true }),
    budget: new FormControl('', { nonNullable: true }),
    craftsmanId: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    const craftsmanId = this.route.snapshot.queryParamMap.get('craftsmanId');
    const craftsmanName = this.route.snapshot.queryParamMap.get('craftsmanName');
    const service = this.route.snapshot.queryParamMap.get('service');

    if (craftsmanId) {
      this.form.controls.craftsmanId.setValue(craftsmanId);
    }

    if (craftsmanName) {
      this.craftsmanName = craftsmanName;
    }

    if (service && this.services.some(item => item.value === service)) {
      this.form.controls.service.setValue(service);
    }
  }

  clearCraftsman(): void {
    this.form.controls.craftsmanId.setValue('');
    this.craftsmanName = '';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const raw = this.form.getRawValue();
    const body: CreateJobDto = {
      service: raw.service,
      description: raw.description,
      city: raw.city,
      address: raw.address,
      preferredDate: raw.preferredDate || null,
      budget: raw.budget.trim() ? Number(raw.budget) : null,
      craftsmanId: raw.craftsmanId.trim() ? raw.craftsmanId : null,
    };

    this.jobsService.createJob(body).subscribe({
      next: () => {
        this.errorHandler.success(this.translate.instant('JOBS.SUCCESS_CREATED'));
        this.router.navigate(['/jobs']);
      },
      error: (error) => {
        this.errorHandler.handle(error);
        this.loading = false;
      },
    });
  }
}
