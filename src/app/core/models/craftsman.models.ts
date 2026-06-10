
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