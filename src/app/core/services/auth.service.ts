import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import {
  LoginDto,
  RegisterDto,
  AuthResponseDto,
  VerifyEmailDto,
  ResendCodeDto,
  SendPhoneVerificationDto,
  VerifyPhoneDto,
  ResendPhoneCodeDto,
  RefreshTokenRequestDto,
  UserInfoDto,
} from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);
  private router = inject(Router);

  private base = `${environment.apiBaseUrl}/auth`;

  login(body: LoginDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.base}/login`, body).pipe(
      tap(r => this.storeSession(r))
    );
  }

  register(body: RegisterDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.base}/register`, body).pipe(
      tap(r => this.storeSession(r))
    );
  }

  verifyEmail(body: VerifyEmailDto): Observable<any> {
    return this.http.post(`${this.base}/verify-email`, body);
  }

  resendEmailCode(body: ResendCodeDto): Observable<any> {
    return this.http.post(`${this.base}/resend-code`, body);
  }

  sendPhoneCode(body: SendPhoneVerificationDto): Observable<any> {
    return this.http.post(`${this.base}/send-phone-code`, body);
  }

  verifyPhone(body: VerifyPhoneDto): Observable<any> {
    return this.http.post(`${this.base}/verify-phone`, body);
  }

  resendPhoneCode(body: ResendPhoneCodeDto): Observable<any> {
    return this.http.post(`${this.base}/resend-phone-code`, body);
  }

  me(): Observable<UserInfoDto> {
    return this.http.get<UserInfoDto>(`${this.base}/me`);
  }

  refreshToken(): Observable<AuthResponseDto> {
    const refreshToken = this.tokenService.getRefreshToken() || '';
    const body: RefreshTokenRequestDto = { refreshToken };
    return this.http.post<AuthResponseDto>(`${this.base}/refresh`, body).pipe(
      tap(r => this.storeSession(r))
    );
  }

  logout(): void {
    const refreshToken = this.tokenService.getRefreshToken() || '';
    const body: RefreshTokenRequestDto = { refreshToken };
    this.http.post(`${this.base}/logout`, body).subscribe({
      complete: () => this.clearAndRedirect(),
      error: () => this.clearAndRedirect(),
    });
  }

  private clearAndRedirect(): void {
    this.tokenService.clearAll();
    this.router.navigate(['/auth/login']);
  }

  private storeSession(r: AuthResponseDto): void {
    this.tokenService.setAccessToken(r.accessToken);
    this.tokenService.setRefreshToken(r.refreshToken);
    this.tokenService.setUser(r.user);
    this.tokenService.setExpiresAt(r.expiresAt);
  }

  isLoggedIn(): boolean {
    return this.tokenService.isLoggedIn();
  }

  getRole(): string | null {
    return this.tokenService.getUser()?.role || null;
  }

  getUserId(): number | null {
    return this.tokenService.getUser()?.id || null;
  }

  getUserName(): string | null {
    return this.tokenService.getUser()?.name || null;
  }
}
