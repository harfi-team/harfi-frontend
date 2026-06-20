import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '@env/environment';
import {
  AdminActionResponse,
  OverviewStats,
  PagedResult,
  PendingCraftsman,
  ApprovedCraftsman,
  RejectedCraftsman,
  CraftsmanDetail,
  AdminUser,
  AdminUserDetail,
  AdminJob,
  AdminJobDetail,
  AdminReview,
  AdminReport,
  AiLog,
  AuditLog,
  ServiceType,
  City,
  FeatureFlag,
  CraftsmenAnalytics,
  JobsAnalytics,
  AiAnalytics,
  ReviewsAnalytics,
} from '@core/models/admin.models';
import { ErrorHandlerService } from '@core/services/error-handler.service';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private errorHandler = inject(ErrorHandlerService);
  private base = `${environment.apiBaseUrl}/v1/admin`;

  private handleError(error: HttpErrorResponse) {
    console.error('[AdminService] API Error:', error.status, error.message, error.url);
    if (error.error?.message) {
      this.errorHandler.error(error.error.message);
    } else {
      this.errorHandler.error('حدث خطأ، يرجى المحاولة لاحقاً');
    }
    return throwError(() => error);
  }

  private buildParams(obj: Record<string, any>): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }

  // ─── Craftsmen ────────────────────────────────────────────────────────

  getPendingCraftsmen(page: number, pageSize: number, city?: string, serviceType?: string): Observable<PagedResult<PendingCraftsman>> {
    return this.http.get<PagedResult<PendingCraftsman>>(`${this.base}/craftsmen/pending`, {
      params: this.buildParams({ page, pageSize, city, serviceType }),
    }).pipe(catchError(this.handleError.bind(this)));
  }

  getApprovedCraftsmen(page: number, pageSize: number, city?: string, serviceType?: string, minRating?: number): Observable<PagedResult<ApprovedCraftsman>> {
    return this.http.get<PagedResult<ApprovedCraftsman>>(`${this.base}/craftsmen/approved`, {
      params: this.buildParams({ page, pageSize, city, serviceType, minRating }),
    }).pipe(catchError(this.handleError.bind(this)));
  }

  getRejectedCraftsmen(page: number, pageSize: number): Observable<PagedResult<RejectedCraftsman>> {
    return this.http.get<PagedResult<RejectedCraftsman>>(`${this.base}/craftsmen/rejected`, {
      params: this.buildParams({ page, pageSize }),
    }).pipe(catchError(this.handleError.bind(this)));
  }

  getCraftsmanById(id: number): Observable<CraftsmanDetail> {
    return this.http.get<CraftsmanDetail>(`${this.base}/craftsmen/${id}`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  approveCraftsman(id: number, notifyMessage?: string): Observable<AdminActionResponse> {
    return this.http.put<AdminActionResponse>(`${this.base}/craftsmen/${id}/approve`, { notifyMessage })
      .pipe(catchError(this.handleError.bind(this)));
  }

  rejectCraftsman(id: number, reason: string): Observable<AdminActionResponse> {
    return this.http.put<AdminActionResponse>(`${this.base}/craftsmen/${id}/reject`, { reason })
      .pipe(catchError(this.handleError.bind(this)));
  }

  suspendCraftsman(id: number, reason: string): Observable<AdminActionResponse> {
    return this.http.put<AdminActionResponse>(`${this.base}/craftsmen/${id}/suspend`, { reason })
      .pipe(catchError(this.handleError.bind(this)));
  }

  deleteCraftsman(id: number, reason: string): Observable<AdminActionResponse> {
    return this.http.delete<AdminActionResponse>(`${this.base}/craftsmen/${id}`, { body: { reason } })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ─── Users ────────────────────────────────────────────────────────────

  getUsers(role?: string, isActive?: boolean, search?: string, page?: number, pageSize?: number): Observable<PagedResult<AdminUser>> {
    return this.http.get<PagedResult<AdminUser>>(`${this.base}/users`, {
      params: this.buildParams({ role, isActive, search, page, pageSize }),
    }).pipe(catchError(this.handleError.bind(this)));
  }

  getUserById(id: number): Observable<AdminUserDetail> {
    return this.http.get<AdminUserDetail>(`${this.base}/users/${id}`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  getUserActivity(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/users/${id}/activity`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  deactivateUser(id: number, reason: string): Observable<AdminActionResponse> {
    return this.http.put<AdminActionResponse>(`${this.base}/users/${id}/deactivate`, { reason })
      .pipe(catchError(this.handleError.bind(this)));
  }

  reactivateUser(id: number): Observable<AdminActionResponse> {
    return this.http.put<AdminActionResponse>(`${this.base}/users/${id}/reactivate`, null)
      .pipe(catchError(this.handleError.bind(this)));
  }

  deleteUser(id: number, reason: string): Observable<AdminActionResponse> {
    return this.http.delete<AdminActionResponse>(`${this.base}/users/${id}`, { body: { reason } })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ─── Jobs ─────────────────────────────────────────────────────────────

  getJobs(status?: string, craftsmanId?: number, customerId?: number, from?: string, to?: string, page?: number, pageSize?: number): Observable<PagedResult<AdminJob>> {
    return this.http.get<PagedResult<AdminJob>>(`${this.base}/jobs`, {
      params: this.buildParams({ status, craftsmanId, customerId, from, to, page, pageSize }),
    }).pipe(catchError(this.handleError.bind(this)));
  }

  getJobById(id: number): Observable<AdminJobDetail> {
    return this.http.get<AdminJobDetail>(`${this.base}/jobs/${id}`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  updateJobStatus(id: number, status: string, justification: string): Observable<AdminActionResponse> {
    return this.http.put<AdminActionResponse>(`${this.base}/jobs/${id}/status`, { status, justification })
      .pipe(catchError(this.handleError.bind(this)));
  }

  flagDispute(id: number, reason: string): Observable<AdminActionResponse> {
    return this.http.put<AdminActionResponse>(`${this.base}/jobs/${id}/flag-dispute`, { reason })
      .pipe(catchError(this.handleError.bind(this)));
  }

  resolveDispute(id: number, resolution: string, favoredParty: string): Observable<AdminActionResponse> {
    return this.http.put<AdminActionResponse>(`${this.base}/jobs/${id}/resolve-dispute`, { resolution, favoredParty })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getJobChatMetadata(id: number): Observable<any> {
    return this.http.get(`${this.base}/jobs/${id}/chat-metadata`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  getJobChatMessages(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/jobs/${id}/chat-messages`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ─── Reviews ──────────────────────────────────────────────────────────

  getReviews(craftsmanId?: number, stars?: number, maxStars?: number, page?: number, pageSize?: number): Observable<PagedResult<AdminReview>> {
    return this.http.get<PagedResult<AdminReview>>(`${this.base}/reviews`, {
      params: this.buildParams({ craftsmanId, stars, maxStars, page, pageSize }),
    }).pipe(catchError(this.handleError.bind(this)));
  }

  getReviewById(id: number): Observable<any> {
    return this.http.get(`${this.base}/reviews/${id}`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  deleteReview(id: number, reason: string): Observable<AdminActionResponse> {
    return this.http.delete<AdminActionResponse>(`${this.base}/reviews/${id}`, { body: { reason } })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ─── Reports ──────────────────────────────────────────────────────────

  getReports(status?: string, type?: string, page?: number, pageSize?: number): Observable<PagedResult<AdminReport>> {
    return this.http.get<PagedResult<AdminReport>>(`${this.base}/reports`, {
      params: this.buildParams({ status, type, page, pageSize }),
    }).pipe(catchError(this.handleError.bind(this)));
  }

  resolveReport(id: number, action: string, notes: string): Observable<AdminActionResponse> {
    return this.http.put<AdminActionResponse>(`${this.base}/reports/${id}/resolve`, { action, notes })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ─── AI Logs ──────────────────────────────────────────────────────────

  getAiLogs(page?: number, pageSize?: number, from?: string, to?: string): Observable<PagedResult<AiLog>> {
    return this.http.get<PagedResult<AiLog>>(`${this.base}/ai-logs`, {
      params: this.buildParams({ page, pageSize, from, to }),
    }).pipe(catchError(this.handleError.bind(this)));
  }

  // ─── Analytics ────────────────────────────────────────────────────────

  getOverviewStats(): Observable<OverviewStats> {
    return this.http.get<OverviewStats>(`${this.base}/analytics/overview`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  getCraftsmenAnalytics(): Observable<CraftsmenAnalytics> {
    return this.http.get<CraftsmenAnalytics>(`${this.base}/analytics/craftsmen`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  getJobsAnalytics(): Observable<JobsAnalytics> {
    return this.http.get<JobsAnalytics>(`${this.base}/analytics/jobs`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  getAiAnalytics(): Observable<AiAnalytics> {
    return this.http.get<AiAnalytics>(`${this.base}/analytics/ai`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  getReviewsAnalytics(): Observable<ReviewsAnalytics> {
    return this.http.get<ReviewsAnalytics>(`${this.base}/analytics/reviews`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  exportData(type: string, from?: string, to?: string): Observable<Blob> {
    return this.http.get(`${this.base}/analytics/export`, {
      params: this.buildParams({ type, from, to }),
      responseType: 'blob',
    }).pipe(catchError(this.handleError.bind(this)));
  }

  // ─── Config — Settings ────────────────────────────────────────────────

  reactivateCraftsman(id: number): Observable<AdminActionResponse> {
    return this.http.put<AdminActionResponse>(`${this.base}/craftsmen/${id}/approve`, {})
      .pipe(catchError(this.handleError.bind(this)));
  }

  getServiceTypes(): Observable<ServiceType[]> {
    return this.http.get<ServiceType[]>(`${this.base}/config/service-types`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  getCities(): Observable<City[]> {
    return this.http.get<City[]>(`${this.base}/config/cities`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  getFeatureFlags(): Observable<FeatureFlag[]> {
    return this.http.get<FeatureFlag[]>(`${this.base}/config/feature-flags`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  toggleFeatureFlag(key: string, isEnabled: boolean): Observable<AdminActionResponse> {
    return this.http.put<AdminActionResponse>(`${this.base}/config/feature-flags/${key}`, { isEnabled })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ─── Audit Logs ───────────────────────────────────────────────────────

  getAuditLogs(adminId?: number, action?: string, targetType?: string, from?: string, to?: string, page?: number, pageSize?: number): Observable<PagedResult<AuditLog>> {
    return this.http.get<PagedResult<AuditLog>>(`${this.base}/audit-logs`, {
      params: this.buildParams({ adminId, action, targetType, from, to, page, pageSize }),
    }).pipe(catchError(this.handleError.bind(this)));
  }

  getAuditLogById(id: number): Observable<AuditLog> {
    return this.http.get<AuditLog>(`${this.base}/audit-logs/${id}`)
      .pipe(catchError(this.handleError.bind(this)));
  }
}
