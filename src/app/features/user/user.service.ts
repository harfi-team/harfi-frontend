import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserProfileDto, UpdateProfileDto } from '../../core/models/user.models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/Users`;

  getProfile(id: number): Observable<UserProfileDto> {
    return this.http.get<UserProfileDto>(`${this.base}/profile/${id}`);
  }

  updateProfile(id: number, dto: UpdateProfileDto): Observable<UserProfileDto> {
    return this.http.put<UserProfileDto>(`${this.base}/profile/${id}`, dto);
  }

  uploadProfileImage(id: number, file: File): Observable<{ url: string }> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ url: string }>(`${this.base}/profile/${id}/upload-image`, fd);
  }
}