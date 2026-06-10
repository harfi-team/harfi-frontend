export interface NotificationDto {
  id: number;
  title: string;
  body: string;
  type: string | null;
  relatedJobId: number | null;
  conversationId: number | null;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCountDto {
  unreadCount: number;
}