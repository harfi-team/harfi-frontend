export type ChatMessageType = 'text' | 'image' | 'voice' | 'location' | 'system';

export interface ConversationDto {
  id: number;
  jobId: number;
  otherUserId: number;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessage: string | null;
  lastMessageType?: ChatMessageType | null;
  lastMessageAt: string | null;
  unreadCount: number;
  isOnline: boolean;
}

export interface MessageDto {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  messageType: ChatMessageType;
  isRead: boolean;
  sentAt: string;
}

export interface SendMessageDto {
  conversationId: number;
  content: string;
  messageType: 'text' | 'image' | 'voice' | 'location';
}

export interface CreateConversationDto {
  jobId: number;
  craftsmanId: number;
}