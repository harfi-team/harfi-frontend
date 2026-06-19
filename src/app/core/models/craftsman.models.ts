// ─── Service Slugs ────────────────────────────────────────────────────────────
export interface ActiveServiceDto {
  nameAr: string;
  nameEn: string;
  icon: string;
}

export interface ActiveCityDto {
  nameAr: string;
  nameEn: string;
}

// ─── Search Params ─────────────────────────────────────────────────────────────


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

export interface CraftsmanProfile {
  id: number;
  userId: number;
  serviceType: string;
  city: string;
  neighborhood: string;
  priceRangeMin: number;
  priceRangeMax: number;
  experience: number;
  bio: string;
  nationalIdUrl: string;
  rating?: number;
  isApproved?: boolean;
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
// ══════════════════════════════════════════════════════════
//  أضف هذه الأنواع إلى ملف: src/app/core/models/craftsman.models.ts
//  (لو بعضها موجود بالفعل، تجاهله وخلي الموجود زي ما هو)
// ══════════════════════════════════════════════════════════

// نوع بيانات تسجيل الحرفي - يطابق POST /api/Craftsmen/register
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

// نوع بيانات الحرفي (DTO) المستخدم فى صفحة البروفايل والبحث
export interface CraftsmanDto {
  id: string;
  name: string;
  city: string;
  neighborhood: string;
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
  portfolioImages?: string[];
  serviceNameEn?: string;
  serviceNameAr?: string;
}

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

export interface CraftsmanSearchParams {
  service?: string;
  city?: string;
  minRating?: number | string;
  minExperience?: number | string;
  search?: string;
}

// ── شكل الرد من GET /api/reviews/craftsman/{id} ──
export interface CraftsmanReviewItem {
  id?: number;
  reviewerName?: string;
  customerName?: string;
  stars: number;
  comment: string;
  createdAt?: string;
  date?: string;
}

export interface CraftsmanReviewsResponse {
  craftsmanId: number;
  totalReviews: number;
  averageStars: number;
  reviews: CraftsmanReviewItem[];
}