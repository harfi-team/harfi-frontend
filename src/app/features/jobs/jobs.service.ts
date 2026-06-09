import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateJobDto, JobAction, JobDto } from '@core/models/job.models';

type ApiListResponse<T> = T[] | { items?: T[]; data?: T[]; result?: T[] };
type ApiItemResponse<T> = T | { item?: T; data?: T; result?: T; job?: T };

@Injectable({ providedIn: 'root' })
export class JobsService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/jobs`;

  createJob(body: CreateJobDto): Observable<void> {
    return this.http.post<void>(this.base, body);
  }

  getCustomerJobs(customerId: number | string): Observable<JobDto[]> {
    return this.http.get<ApiListResponse<JobDto>>(`${this.base}/customer/${customerId}`).pipe(
      map(response => this.extractList(response)),
    );
  }

  getCraftsmanJobs(craftsmanId: number | string): Observable<JobDto[]> {
    return this.http.get<ApiListResponse<JobDto>>(`${this.base}/craftsman/${craftsmanId}`).pipe(
      map(response => this.extractList(response)),
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

    if (typeof response === 'object' && ('item' in response || 'data' in response || 'result' in response || 'job' in response)) {
      return response.item ?? response.data ?? response.result ?? response.job ?? null;
    }

    return response as T;
  }
}
