import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  AdminStatsDto,
  CraftsmanAdminDto,
  CraftsmenFilterDto,
  CustomerAdminDto,
  FilterDto,
  JobAdminDto,
  JobFilterDto,
  PagedResult,
  ReviewAdminDto,
} from '@core/models/admin.models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/Admin`;

  getDashboardStats(): Observable<AdminStatsDto> {
    return this.http.get<AdminStatsDto>(`${this.base}/stats`);
  }

  getCraftsmen(params: CraftsmenFilterDto): Observable<PagedResult<CraftsmanAdminDto>> {
    let httpParams = new HttpParams();
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.city) httpParams = httpParams.set('city', params.city);
    if (params.specialty) httpParams = httpParams.set('specialty', params.specialty);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize);
    return this.http.get<PagedResult<CraftsmanAdminDto>>(`${this.base}/craftsmen`, {
      params: httpParams,
    });
  }

  approveCraftsman(id: string): Observable<void> {
    return this.http.put<void>(`${this.base}/craftsmen/${id}/approve`, {});
  }

  rejectCraftsman(id: string): Observable<void> {
    return this.http.put<void>(`${this.base}/craftsmen/${id}/reject`, {});
  }

  deleteCraftsman(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/craftsmen/${id}`);
  }

  getCustomers(params: FilterDto): Observable<PagedResult<CustomerAdminDto>> {
    let httpParams = new HttpParams();
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize);
    return this.http.get<PagedResult<CustomerAdminDto>>(`${this.base}/customers`, {
      params: httpParams,
    });
  }

  deleteCustomer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/customers/${id}`);
  }

  getJobs(params: JobFilterDto): Observable<PagedResult<JobAdminDto>> {
    let httpParams = new HttpParams();
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize);
    return this.http.get<PagedResult<JobAdminDto>>(`${this.base}/jobs`, {
      params: httpParams,
    });
  }

  resolveDispute(jobId: string): Observable<void> {
    return this.http.put<void>(`${this.base}/jobs/${jobId}/resolve-dispute`, {});
  }

  exportJobs(): Observable<Blob> {
    return this.http.get(`${this.base}/jobs/export`, { responseType: 'blob' });
  }

  getReviews(params: FilterDto): Observable<PagedResult<ReviewAdminDto>> {
    let httpParams = new HttpParams();
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize);
    return this.http.get<PagedResult<ReviewAdminDto>>(`${this.base}/reviews`, {
      params: httpParams,
    });
  }

  deleteReview(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/reviews/${id}`);
  }
}
