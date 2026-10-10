import { api } from './client';
import { PaginatedResult } from './listings';

export interface MessageSender {
  id: string;
  name: string;
  profileImageUrl?: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  content: string;
  senderId?: string;
  sender: MessageSender;
  readAt?: string | null;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  listingId: string;
  listing: {
    id: string;
    title: string;
    status: string;
    images: { imageUrl: string }[];
  };
  otherParticipant: MessageSender;
  lastMessage?: ChatMessage | null;
  unreadCount: number;
  createdAt: string;
}

export const conversationsApi = {
  getConversations: () =>
    api.get<ConversationSummary[]>('/conversations'),

  getOrCreateConversation: (listingId: string) =>
    api.post<ConversationSummary>('/conversations', { listingId }),

  getMessages: (conversationId: string, page = 1, pageSize = 50) =>
    api.get<PaginatedResult<ChatMessage>>(`/conversations/${conversationId}/messages`, {
      page,
      pageSize,
    }),

  sendMessage: (conversationId: string, content: string) =>
    api.post<ChatMessage>(`/conversations/${conversationId}/messages`, { content }),
};
