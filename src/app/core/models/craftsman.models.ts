// ─── Service Slugs ────────────────────────────────────────────────────────────

export type CraftsmanServiceSlug =
  | 'plumbing'
  | 'electrical'
  | 'carpentry'
  | 'painting'
  | 'ac'
  | 'cleaning'
  | 'moving'
  | 'pest'
  | 'roofing';

// ─── Main Craftsman DTO (used in search results & profile) ────────────────────

export interface CraftsmanDto {
  id: string;
  name: string;
  city: string;
  neighborhood?: string;        // restored — API returns this field
  specialty: string;
  services: CraftsmanServiceSlug[];
  rating: number;
  reviewsCount: number;
  experienceYears: number;
  bio: string;
  avatarUrl?: string;
  priceMin?: number;
  priceMax?: number;
  minPrice?: number;
}

// ─── Search Params ─────────────────────────────────────────────────────────────

export interface CraftsmanSearchParams {
  service?: CraftsmanServiceSlug | '';
  search?: string;
  city?: string;
  minRating?: number | '';
  minExperience?: number | '';
}

// ─── Registration (POST /api/craftsmen/register) ──────────────────────────────

export interface CraftsmanRegistrationDto {
  userId: number;
  serviceType: string;
  city: string;
  neighborhood: string;
  priceRangeMin: number;
  priceRangeMax: number;
  experience: number;
  bio: string;
  nationalIdUrl: string;
}

// ─── Reviews (GET /api/reviews/craftsman/{craftsmanId}) ───────────────────────

export interface ReviewItemDto {
  id: number;
  jobId: number;
  stars: number;
  comment: string;
  customerName: string;
  createdAt: string;
}

export interface ReviewsResponseDto {
  craftsmanId: number;
  totalReviews: number;
  averageStars: number;
  reviews: ReviewItemDto[];
}

// ─── Conversations (POST /api/conversations) ──────────────────────────────────

export interface StartConversationDto {
  jobId: number;
  craftsmanId: number;
}