
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CraftsmanRegistrationDto, CraftsmanSearchFilters, CraftsmanCardDto } from '../../core/models/craftsman.models';

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
}