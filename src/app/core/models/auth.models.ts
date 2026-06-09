export type UserRole = 'customer' | 'craftsman' | 'admin';

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'customer' | 'craftsman';
  phone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserInfoDto;
}

export interface UserInfoDto {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string;
  profileImageUrl: string;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface VerifyEmailDto {
  email: string;
  code: string;
}

export interface ResendCodeDto {
  email: string;
}

export interface SendPhoneVerificationDto {
  email: string;
  phoneNumber: string;
}

export interface VerifyPhoneDto {
  email: string;
  phoneNumber: string;
  code: string;
}

export interface ResendPhoneCodeDto {
  email: string;
  phoneNumber: string;
}
