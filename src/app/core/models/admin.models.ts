export interface AdminStatsDto {
  totalCraftsmen: number;
  pendingApproval: number;
  totalCustomers: number;
  completedJobs: number;
  pendingJobs: number;
  monthlyRevenue: number;
  craftsmenGrowthPercent: number;
  customersGrowthPercent: number;
  jobsGrowthPercent: number;
  revenueGrowthPercent: number;
}

export interface CraftsmanAdminDto {
  id: string;
  name: string;
  phone: string;
  specialty: string;
  city: string;
  status: 'pending' | 'approved' | 'rejected';
  registrationDate: string;
  avatarUrl?: string;
}

export interface CustomerAdminDto {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  joinDate: string;
  totalJobs: number;
}

export interface JobAdminDto {
  id: string;
  clientName: string;
  clientAvatar: string;
  craftsmanName: string;
  craftsmanAvatar: string;
  service: string;
  specialty: string;
  city: string;
  date: string;
  status: 'open' | 'in-progress' | 'done' | 'rejected';
  hasDispute: boolean;
}

export interface ReviewAdminDto {
  id: string;
  customerName: string;
  craftsmanName: string;
  rating: number;
  comment: string;
  date: string;
  status: string;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CraftsmenFilterDto {
  search?: string;
  city?: string;
  specialty?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface JobFilterDto {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface FilterDto {
  search?: string;
  page?: number;
  pageSize?: number;
}
