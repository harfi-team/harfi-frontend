export interface UserProfileDto {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  profileImageUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface UpdateProfileDto {
  name: string;
  phone: string | null;
  profileImageUrl: string | null; 
}