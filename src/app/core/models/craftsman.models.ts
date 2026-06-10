
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

// الفلاتر المرسلة للباك اند بناءً على السويجر
export interface CraftsmanSearchFilters {
  serviceType?: string;
  city?: string;
  minRating?: number;
  minExperience?: number;
  searchTerm?: string; // للبحث النصي العلوي في الفرونت اند
}

// داتا الحرفي العائدة في نتائج البحث لعرضها بالكارت
export interface CraftsmanCardDto {
  id: number;
  fullName: string;
  photoUrl: string;
  serviceType: string;
  city: string;
  rating: number;
  priceRangeMin: number;
  priceRangeMax: number;
  experience: number;
  bio: string;
}
// ... (الأكواد الحالية الخاصة بالـ Registration والـ Search زي ما هي)

// داتا البروفايل الراجعة من GET /api/Craftsmen/{id}
export interface CraftsmanProfileDto {
  id: number;
  fullName: string;
  profileImageUrl: string;
  city: string;
  neighborhood: string;
  priceRangeMin: number;
  priceRangeMax: number;
  experience: number;
  bio: string;
  // خصائص إضافية نحتاجها للـ UI (قد تحتاجين إضافتها للـ Backend أو حسابها)
  serviceType?: string; 
  rating?: number;
  completedJobs?: number;
  skills?: string[];
  previousWorks?: string[];
}

// داتا التقييمات الراجعة من GET /api/reviews/craftsman/{craftsmanId}
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

// داتا إنشاء محادثة جديدة POST /api/Conversations
export interface StartConversationDto {
  jobId: number; // حسب الـ Swagger يحتاج jobId، ممكن ترسلي 0 لو المحادثة عامة
  craftsmanId: number;
}