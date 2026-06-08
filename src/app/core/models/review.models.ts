// ════════════════════════════════════════════════════════════
//  REQUEST MODELS — what we SEND to the backend
// ════════════════════════════════════════════════════════════

/**
 * POST /api/reviews
 * Customer submits a star review after job is done.
 * customerId NOT included — backend reads it from JWT token.
 */
export interface CreateReviewRequest {
  jobId: number;
  stars: number;
  comment?: string;
}
/**
 * POST /api/reviews/rag-feedback
 * User rates the AI self-fix guide after reading it.
 */
export interface CreateRagFeedbackRequest {
  ragDocumentId: number;
  feedbackType: 'ساعدني' | 'محتاج حرفي';
}

/**
 * POST /api/AI/chat
 * User sends a message to the AI assistant.
 */
export interface AiChatRequest {
  message: string;
  sessionId?: string;
}

// ════════════════════════════════════════════════════════════
//  RESPONSE MODELS — what we GET from the backend
// ════════════════════════════════════════════════════════════

/**
 * Single review object returned by:
 *   GET  /api/reviews/craftsman/{id}
 */
export interface ReviewResponse {
  id: number;
  jobId: number;
  stars: number;
  comment?: string;
  customerName: string;
  createdAt: string;
}

/**
 * Returned by GET /api/reviews/craftsman/{craftsmanId}
 * Includes summary stats + list of reviews.
 */
export interface CraftsmanReviewsResponse {
  craftsmanId: number;
  totalReviews: number;
  averageStars: number; // e.g. 4.6
  reviews: ReviewResponse[];
}
