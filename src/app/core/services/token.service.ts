import { Injectable } from '@angular/core';
import { UserInfoDto } from '../models/auth.models';

const KEYS = {
  access: 'harfi_access',
  refresh: 'harfi_refresh',
  user: 'harfi_user',
  expires: 'harfi_expires',
};

@Injectable({ providedIn: 'root' })
export class TokenService {
  getAccessToken(): string | null {
    return localStorage.getItem(KEYS.access);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(KEYS.refresh);
  }

  getUser(): UserInfoDto | null {
    const raw = localStorage.getItem(KEYS.user);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserInfoDto;
    } catch {
      return null;
    }
  }

  getExpiresAt(): string | null {
    return localStorage.getItem(KEYS.expires);
  }

  setAccessToken(token: string): void {
    localStorage.setItem(KEYS.access, token);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(KEYS.refresh, token);
  }

  setUser(user: UserInfoDto): void {
    localStorage.setItem(KEYS.user, JSON.stringify(user));
  }

  setExpiresAt(expiresAt: string): void {
    localStorage.setItem(KEYS.expires, expiresAt);
  }

  isLoggedIn(): boolean {
    const token = this.getAccessToken();
    const expires = this.getExpiresAt();
    if (!token || !expires) return false;
    return Date.now() < new Date(expires).getTime();
  }

  clearAll(): void {
    localStorage.removeItem(KEYS.access);
    localStorage.removeItem(KEYS.refresh);
    localStorage.removeItem(KEYS.user);
    localStorage.removeItem(KEYS.expires);
  }
}
