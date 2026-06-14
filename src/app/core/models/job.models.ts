export type JobStatus = 'open' | 'in-progress' | 'done' | 'rejected';

export type JobAction = 'accept' | 'reject' | 'complete';

export type JobOwnerRole = 'customer' | 'craftsman';

export interface JobDto {
  id: string;
  customerId?: number | string;
  customerName?: string;
  craftsmanId?: number | string | null;
  craftsmanName?: string | null;
  service: string;
  description: string;
  city: string;
  address?: string;
  budget?: number | null;
  preferredDate?: string | null;
  problemImageUrl?: string | null;
  problemDescription?: string | null;
  solutionDescription?: string | null;
  status: JobStatus;
  conversationId?: number;
  createdAt?: string;
  completedAt?: string | null;
  updatedAt?: string;
}

export interface CreateJobDto {
  service: string;
  description: string;
  city: string;
  address: string;
  budget?: number | null;
  preferredDate?: string | null;
  craftsmanId?: number | string | null;
  problemImageUrl?: string | null;
  problemDescription?: string | null;
}
