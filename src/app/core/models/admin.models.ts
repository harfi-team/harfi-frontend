export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminActionResponse {
  success: boolean;
  message: string;
  data: null;
}

export interface OverviewStats {
  totalUsers: number;
  totalCraftsmen: number;
  pendingCraftsmen: number;
  activeJobs: number;
  completedJobs: number;
  disputedJobs: number;
  pendingReports: number;
  totalReviews: number;
  newUsersThisMonth: number;
  averageRating: number;
  recentCraftsmen: RecentCraftsman[];
  recentOrders: RecentOrder[];
}

export interface RecentCraftsman {
  id: number;
  fullName: string;
  profileImageUrl: string | null;
  serviceType: string;
  city: string;
  status: string;
  createdAt: string;
}

export interface RecentOrder {
  id: number;
  serviceType: string;
  status: string;
  createdAt: string;
}

export interface PendingCraftsman {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  profileImageUrl: string | null;
  serviceType: string;
  city: string;
  neighborhood: string;
  experience: number;
  nationalIdUrl: string;
  bio: string;
  createdAt: string;
  isDeleted?: boolean;
  isApproved?: boolean;
  rejectionReason?: string | null;
}

export interface ApprovedCraftsman extends PendingCraftsman {
  rating: number;
  isAvailable: boolean;
}

export interface RejectedCraftsman {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  profileImageUrl: string | null;
  serviceType: string;
  city: string;
  rejectionReason: string;
  createdAt: string;
  deletedAt: string;
  isDeleted: boolean;
  isApproved: boolean;
  isAvailable: boolean;
  deletionReason: string | null;
}

export interface CraftsmanDetail {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  profileImageUrl: string;
  serviceType: string;
  city: string;
  neighborhood: string;
  priceRangeMin: number;
  priceRangeMax: number;
  experience: number;
  isApproved: boolean;
  isAvailable: boolean;
  isDeleted: boolean;
  rating: number;
  bio: string;
  nationalIdUrl: string;
  rejectionReason: string | null;
  deletionReason: string | null;
  createdAt: string;
  updatedAt: string;
  completedJobsCount: number;
  totalReviews: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  isDeleted: boolean;
  profileImageUrl: string | null;
  createdAt: string;
  deletedAt?: string | null;
  deletionReason?: string | null;
  updatedAt?: string;
}

export interface AdminUserDetail extends AdminUser {
  craftsmanProfileId: number | null;
  jobsCount: number;
  reviewsCount: number;
  deletionReason: string | null;
  deletedAt: string | null;
}

export interface AdminJob {
  id: number;
  customerId: number;
  customerName: string;
  craftsmanId: number;
  craftsmanName: string;
  customerProfileImageUrl: string | null;
  craftsmanProfileImageUrl: string | null;
  status: string;
  serviceType: string;
  description: string;
  address: string;
  isDisputed: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface AdminJobDetail extends AdminJob {
  preferredDate: string | null;
  problemImageUrl: string | null;
  problemDescription: string | null;
  solutionDescription: string | null;
  disputeRaisedAt: string | null;
  disputeResolvedAt: string | null;
  disputeResolution: string | null;
  updatedAt: string;
}

export interface AdminReview {
  id: number;
  jobId: number;
  customerId: number;
  customerName: string;
  craftsmanId: number;
  craftsmanName: string;
  stars: number;
  comment: string;
  isDeleted: boolean;
  createdAt: string;
  deletedAt?: string;
  deletionReason?: string | null;
  customer?: { id: number; name: string; isDeleted: boolean };
  craftsman?: { id: number; name: string; isDeleted: boolean };
}

export interface AdminReport {
  id: number;
  reportedByUserId: number;
  reportedByUserName: string;
  targetType: string;
  targetId: number;
  reason: string;
  status: string;
  resolvedByAdminId: number | null;
  resolutionNotes: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface AiLog {
  id: number;
  userId: number;
  userName: string;
  sessionId: string;
  role: string;
  content: string;
  toolUsed: string | null;
  tokensUsed: number;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  adminId: number;
  adminName: string;
  action: string;
  targetType: string;
  targetId: number;
  notes: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface ServiceType {
  nameAr: string;
}

export interface City {
  nameAr: string;
}

export interface FeatureFlag {
  key: string;
  isEnabled: boolean;
  updatedAt: string;
}

export interface CraftsmenAnalytics {
  totalCraftsmen: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  suspended: number;
  averageRating: number;
  byServiceType: Record<string, number>;
  byCity: Record<string, number>;
}

export interface JobsAnalytics {
  totalJobs: number;
  open: number;
  inProgress: number;
  completed: number;
  rejected: number;
  disputed: number;
  byServiceType: Record<string, number>;
  averageCompletionDays: number;
}

export interface AiAnalytics {
  totalChats: number;
  totalTokensUsed: number;
  totalCraftsmenIngested: number;
  totalSolutionsIngested: number;
  averageTokensPerChat: number;
}

export interface ReviewsAnalytics {
  totalReviews: number;
  averageStars: number;
  starDistribution: Record<string, number>;
  deletedReviews: number;
}
