import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateReviewRequest,
  CreateRagFeedbackRequest,
  ReviewResponse,
  CraftsmanReviewsResponse,
} from '../../core/models/review.models';

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  private http = inject(HttpClient);

  private readonly baseUrl = `${environment.apiBaseUrl}/reviews`;
  // ════════════════════════════════════════════════════════════
  //  POST /api/reviews
  //  Called by: ReviewFormComponent
  //  Who calls it: Customer after job status = done
  // ════════════════════════════════════════════════════════════
  submitReview(data: CreateReviewRequest): Observable<{ message: string; data: ReviewResponse }> {
    return this.http.post<{ message: string; data: ReviewResponse }>(this.baseUrl, data);
  }
  // ════════════════════════════════════════════════════════════
  //  GET /api/reviews/craftsman/{craftsmanId}
  //  Called by: Craftsman profile page
  // ════════════════════════════════════════════════════════════
  getCraftsmanReviews(craftsmanId: number): Observable<CraftsmanReviewsResponse> {
    return this.http.get<CraftsmanReviewsResponse>(`${this.baseUrl}/craftsman/${craftsmanId}`);
  }
  // ════════════════════════════════════════════════════════════
  //  POST /api/reviews/rag-feedback
  //  Called by: AiChatComponent (after AI guide shown)
  //  Who calls it: Any logged-in user
  // ════════════════════════════════════════════════════════════
  submitRagFeedback(data: CreateRagFeedbackRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/rag-feedback`, data);
  }
}
