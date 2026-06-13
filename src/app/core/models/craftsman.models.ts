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

export interface CraftsmanDto {
  id: string;
  name: string;
  city: string;
  specialty: string;
  serviceNameAr?: string;
  serviceNameEn?: string;
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

export interface CraftsmanSearchParams {
  service?: CraftsmanServiceSlug | '';
  search?: string;
  city?: string;
  minRating?: number | '';
  minExperience?: number | '';
}
