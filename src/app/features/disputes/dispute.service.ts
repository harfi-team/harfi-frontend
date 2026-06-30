import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateDisputeRequest, DisputeDetailDto, DisputeSummaryDto } from '../../core/models/dispute.models';

type ApiListResponse<T> = T[] | { items?: T[]; data?: T[]; result?: T[] };

@Injectable({ providedIn: 'root' })
export class DisputeService {
  private http = inject(HttpClient);
  private jobsBase = `${environment.apiBaseUrl}/jobs`;
  private disputesBase = `${environment.apiBaseUrl}/disputes`;

  createDispute(jobId: string, body: CreateDisputeRequest): Observable<DisputeDetailDto> {
    return this.http.post<DisputeDetailDto>(`${this.jobsBase}/${jobId}/dispute`, body);
  }

  getDisputeByJob(jobId: string): Observable<DisputeDetailDto> {
    return this.http.get<DisputeDetailDto>(`${this.jobsBase}/${jobId}/dispute`);
  }

  getMyDisputes(): Observable<DisputeSummaryDto[]> {
    return this.http.get<ApiListResponse<DisputeSummaryDto>>(`${this.disputesBase}/my`).pipe(
      map((response) => {
        if (Array.isArray(response)) return response;
        return response.items ?? response.data ?? response.result ?? [];
      }),
    );
  }

  respondToDispute(disputeId: number, body: { message: string; attachments?: string }): Observable<DisputeDetailDto> {
    return this.http.post<DisputeDetailDto>(`${this.disputesBase}/${disputeId}/response`, body);
  }

  uploadDisputeImage(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const uploadUrl = environment.apiBaseUrl.replace('/api', '') + '/api/jobs/upload-image';
    return this.http.post<{ url: string }>(uploadUrl, formData);
  }
}
