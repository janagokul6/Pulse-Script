import { useMemo, useState } from 'react';

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

const CURRENT_USER_ID = 'me';

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    otherUser: {
      id: 'user-1',
      name: 'Dr. Sarah Chen',
      specialization: 'Cardiology',
      avatarUrl: null,
    },
    lastMessage: 'Thanks for sharing that STEMI case — really insightful.',
    lastMessageAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    unreadCount: 0,
  },
  {
    id: 'conv-2',
    otherUser: {
      id: 'user-2',
      name: 'Dr. Marcus Thorne',
      specialization: 'Neurology',
      avatarUrl: null,
    },
    lastMessage: 'Would love your thoughts on a complex migraine workup.',
    lastMessageAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    unreadCount: 2,
  },
];

const MOCK_MESSAGES: Message[] = [
  {
    id: 'm-1',
    conversationId: 'conv-1',
    senderId: 'user-1',
    body: 'Hey, saw your case on atypical MI presentation. Really impressive work.',
    type: 'text',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    status: 'read',
  },
  {
    id: 'm-2',
    conversationId: 'conv-1',
    senderId: CURRENT_USER_ID,
    body: 'Thank you! Happy to share more details if helpful.',
    type: 'text',
    createdAt: new Date(Date.now() - 2.8 * 60 * 60 * 1000).toISOString(),
    status: 'read',
  },
  {
    id: 'm-3',
    conversationId: 'conv-2',
    senderId: 'user-2',
    body: 'I have a 30yo with rapid-onset neuro deficit, normal CT. Echoing your MedLore post.',
    type: 'text',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    status: 'sent',
  },
  {
    id: 'm-4',
    conversationId: 'conv-2',
    senderId: CURRENT_USER_ID,
    body: 'Happy to chat — can you share any imaging or lab details?',
    type: 'text',
    createdAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
    status: 'sent',
  },
];

export function useConversations() {
  // Placeholder for future HTTP API integration (e.g. api.get('/conversations')).
  const [conversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);

  return {
    data: conversations,
    isLoading: false,
  };
}

export function useMessages(conversationId: string) {
  const initialMessages = useMemo(
    () => MOCK_MESSAGES.filter((m) => m.conversationId === conversationId),
    [conversationId],
  );

  const [messages, setMessages] = useState<Message[]>(initialMessages);

  const sendMessage = (payload: {
    body: string;
    type?: MessageType;
    attachmentUrl?: string;
    attachmentName?: string;
  }) => {
    const now = new Date().toISOString();
    const message: Message = {
      id: `local-${now}`,
      conversationId,
      senderId: CURRENT_USER_ID,
      body: payload.body,
      type: payload.type ?? 'text',
      createdAt: now,
      status: 'sent',
      attachmentUrl: payload.attachmentUrl,
      attachmentName: payload.attachmentName,
    };

    setMessages((prev) => [...prev, message]);

    // Placeholder for future HTTP API call:
    // await api.post('/messages', { conversationId, ...payload });
  };

  return {
    messages,
    sendMessage,
    currentUserId: CURRENT_USER_ID,
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

