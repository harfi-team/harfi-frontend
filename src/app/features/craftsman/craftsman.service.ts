
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CraftsmanRegistrationDto, CraftsmanSearchFilters, CraftsmanCardDto,StartConversationDto,ReviewsResponseDto,CraftsmanProfileDto  } from '../../core/models/craftsman.models';

@Injectable({
  providedIn: 'root'
})
export class CraftsmanService {
  private baseUrl = 'http://localhost:5108/api/Craftsmen';

  constructor(private http: HttpClient) { }

  // دالة التسجيل الحالية الخاصة بكِ
  registerCraftsman(craftsmanData: CraftsmanRegistrationDto): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, craftsmanData);
  }

  // دالة البحث والتصفية الجديدة
  searchCraftsmen(filters: CraftsmanSearchFilters): Observable<CraftsmanCardDto[]> {
    let params = new HttpParams();

    if (filters.serviceType) {
      params = params.set('ServiceType', filters.serviceType);
    }
    if (filters.city) {
      params = params.set('City', filters.city);
    }
    if (filters.minRating) {
      params = params.set('MinRating', filters.minRating.toString());
    }
    if (filters.minExperience) {
      params = params.set('MinExperience', filters.minExperience.toString());
    }

    return this.http.get<CraftsmanCardDto[]>(`${this.baseUrl}/search`, { params });
  }
  


 
  // دالة حجز خدمة (تستدعي POST /api/jobs)
  bookJob(craftsmanId: number): Observable<any> {
    const payload = { craftsmanId: craftsmanId }; // يمكن تعديل الـ payload حسب الـ Swagger الفعلي لـ Jobs
    return this.http.post(`${this.baseUrl}/jobs`, payload);
  }

  // دالة بدء محادثة (تستدعي POST /api/Conversations)
  startConversation(data: StartConversationDto): Observable<any> {
    return this.http.post(`${this.baseUrl}/Conversations`, data);
  }

  // دالة جلب بيانات الحرفي (بتكلم CraftsmenController)
  getCraftsmanProfile(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  // دالة جلب التقييمات والمراجعات (بتكلم ReviewsController)
  getCraftsmanReviews(craftsmanId: number): Observable<any> {
    // لاحظي إن الرابط هنا مختلف عشان يطابق الـ Swagger
    const reviewsUrl = `http://localhost:5108/api/reviews/craftsman/${craftsmanId}`;
    return this.http.get<any>(reviewsUrl);
  }
}