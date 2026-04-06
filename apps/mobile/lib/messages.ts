import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export type Conversation = {
  id: string;
  otherUser: {
    id: string;
    name: string;
    specialization: string | null;
    avatarUrl: string | null;
  };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

export type MessageType = 'text' | 'image' | 'file';

export type MessageStatus = 'sent' | 'read';

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  type: MessageType;
  createdAt: string;
  status?: MessageStatus;
  attachmentUrl?: string;
  attachmentName?: string;
};

export function useConversations() {
  const [data, setData] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<{ conversations: Conversation[] }>('/conversations');
      setData(res.data.conversations);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch conversations'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return { data, isLoading, error, refetch: fetchConversations };
}

export function useMessages(conversationId: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<{ messages: Message[] }>(`/conversations/${conversationId}/messages`);
      setMessages(res.data.messages);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch messages'));
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = useCallback(
    async (payload: {
      body: string;
      type?: MessageType;
      attachmentUrl?: string;
      attachmentName?: string;
    }) => {
      try {
        const res = await api.post<Message>(`/conversations/${conversationId}/messages`, payload);
        setMessages((prev) => [...prev, res.data]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to send message'));
      }
    },
    [conversationId],
  );

  const markAsRead = useCallback(async () => {
    try {
      await api.post(`/conversations/${conversationId}/read`);
    } catch {
      // non-critical, ignore silently
    }
  }, [conversationId]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    currentUserId: user?.id ?? '',
    markAsRead,
    refetch: fetchMessages,
  };
}

export function formatTimeAgo(dateString: string) {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) return `${diffDay}d ago`;
  if (diffHour > 0) return `${diffHour}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return 'Just now';
}
