import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateJobDto, JobAction, JobDto, JobStatus } from '../../core/models/job.models';

type ApiListResponse<T> = T[] | { items?: T[]; data?: T[]; result?: T[] };
type ApiItemResponse<T> = T | { item?: T; data?: T; result?: T; job?: T };

const STATUS_MAP: Record<string, JobStatus> = {
  مفتوح: 'open',
  'قيد التنفيذ': 'in-progress',
  مكتمل: 'done',
  مرفوض: 'rejected',
  ملغى: 'rejected',
  open: 'open',
  'in-progress': 'in-progress',
  done: 'done',
  rejected: 'rejected',
};

@Injectable({ providedIn: 'root' })
export class JobsService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/jobs`;

  createJob(body: CreateJobDto): Observable<any> {
    const payload: any = {
      craftsmanId: body.craftsmanId ? Number(body.craftsmanId) : undefined,
      serviceType: body.service,
      description: body.description,
      address: body.address,
      preferredDate: body.preferredDate || undefined,
      problemImageUrl: body.problemImageUrl || undefined,
      problemDescription: body.problemDescription || undefined,
    };
    return this.http.post<any>(this.base, payload);
  }

  uploadJobImage(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const uploadUrl = environment.apiBaseUrl.replace('/api', '') + '/api/jobs/upload-image';
    return this.http.post<{ url: string }>(uploadUrl, formData);
  }

  getCustomerJobs(customerId: number | string): Observable<JobDto[]> {
    return this.http.get<ApiListResponse<any>>(`${this.base}/customer/${customerId}`).pipe(
      map((response) => this.extractList(response)),
      map((items) => items.map((item) => this.normalizeJob(item))),
    );
  }

  getCraftsmanJobs(craftsmanId: number | string): Observable<JobDto[]> {
    return this.http.get<ApiListResponse<any>>(`${this.base}/craftsman/${craftsmanId}`).pipe(
      map((response) => this.extractList(response)),
      map((items) => items.map((item) => this.normalizeJob(item))),
    );
  }

  acceptJob(jobId: string): Observable<void> {
    return this.http.put<void>(`${this.base}/${jobId}/accept`, {});
  }

  rejectJob(jobId: string): Observable<void> {
    return this.http.put<void>(`${this.base}/${jobId}/reject`, {});
  }

  completeJob(jobId: string): Observable<void> {
    return this.http.put<void>(`${this.base}/${jobId}/complete`, {});
  }

  performAction(jobId: string, action: JobAction): Observable<void> {
    switch (action) {
      case 'accept':
        return this.acceptJob(jobId);
      case 'reject':
        return this.rejectJob(jobId);
      case 'complete':
        return this.completeJob(jobId);
      default:
        throw new Error('Unsupported job action');
    }
  }

  private normalizeJob(raw: any): JobDto {
    return {
      id: String(raw.id),
      customerId: raw.customerId,
      customerName: raw.customerName,
      craftsmanId: raw.craftsmanId,
      craftsmanName: raw.craftsmanName,
      service: raw.service || raw.serviceType || '',
      description: raw.description || raw.problemDescription || '',
      city: raw.city || '',
      address: raw.address || '',
      budget: raw.budget ?? null,
      preferredDate: raw.preferredDate || null,
      problemImageUrl: raw.problemImageUrl || null,
      status: STATUS_MAP[raw.status] || 'open',
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  private extractList<T>(response: ApiListResponse<T>): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    return response.items ?? response.data ?? response.result ?? [];
  }

  private extractItem<T>(response: ApiItemResponse<T>): T | null {
    if (!response) {
      return null;
    }

    if (Array.isArray(response)) {
      return response[0] ?? null;
    }

    if (
      typeof response === 'object' &&
      ('item' in response || 'data' in response || 'result' in response || 'job' in response)
    ) {
      return response.item ?? response.data ?? response.result ?? response.job ?? null;
    }

    return response as T;
  }
}
