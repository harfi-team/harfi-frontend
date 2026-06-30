export interface CreateDisputeRequest {
  reason: string;
  description?: string;
  attachments?: string;
}

export interface DisputeResponseRequest {
  message: string;
  attachments?: string;
}

export interface DisputeSummaryDto {
  id: number;
  jobId: number;
  status: string;
  raisedByRole: string;
  reason: string;
  createdAt: string;
  resolvedAt: string | null;
  favoredParty: string | null;
}

export interface DisputeDetailDto {
  id: number;
  jobId: number;
  jobServiceType: string;
  jobStatus: string;
  jobDescription: string;

  raisedByUserId: number;
  raisedByUserName: string;
  raisedByRole: string;

  status: string;
  reason: string;
  description: string | null;
  attachments: string | null;
  createdAt: string;
  resolvedAt: string | null;

  responseMessage: string | null;
  responseAttachments: string | null;

  resolution: string | null;
  favoredParty: string | null;
  resolvedByAdminId: number | null;
  resolvedByAdminName: string | null;

  customerId: number;
  customerName: string;
  craftsmanId: number;
  craftsmanName: string;

  conversationId: number;
  hasActiveDispute: boolean;
}
