import { and, asc, desc, eq, ne, sql } from 'drizzle-orm';
import {
  db,
  createId,
  conversations,
  conversationParticipants,
  messages,
  users,
} from '../../db/index.js';
import { BadRequestError, ForbiddenError } from '../../lib/errors.js';
import type { Message } from '../../db/schema.js';

export interface ConversationItem {
  id: string;
  otherUser: {
    id: string;
    name: string | null;
    specialization: string | null;
    avatarUrl: string | null;
  };
  lastMessage: string;
  lastMessageAt: Date | null;
  unreadCount: number;
}

// ─── getOrCreateConversation ────────────────────────────────────────────────

export async function getOrCreateConversation(
  currentUserId: string,
  recipientId: string,
) {
  if (currentUserId === recipientId) {
    throw new BadRequestError('Cannot create a conversation with yourself');
  }

  // Find existing conversation where both users are participants
  const existing = await db
    .select({ conversationId: conversationParticipants.conversationId })
    .from(conversationParticipants)
    .where(eq(conversationParticipants.userId, currentUserId))
    .then(async (rows) => {
      const ids = rows.map((r) => r.conversationId);
      if (ids.length === 0) return null;
      // Find one where the recipient is also a participant
      for (const cid of ids) {
        const [match] = await db
          .select()
          .from(conversationParticipants)
          .where(
            and(
              eq(conversationParticipants.conversationId, cid),
              eq(conversationParticipants.userId, recipientId),
            ),
          )
          .limit(1);
        if (match) return cid;
      }
      return null;
    });

  if (existing) {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, existing))
      .limit(1);
    return conv!;
  }

  // Create new conversation
  const id = createId();
  const now = new Date();
  await db.insert(conversations).values({ id, createdAt: now, updatedAt: now });
  await db.insert(conversationParticipants).values([
    { conversationId: id, userId: currentUserId, unreadCount: 0 },
    { conversationId: id, userId: recipientId, unreadCount: 0 },
  ]);

  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id))
    .limit(1);
  return conv!;
}

// ─── listConversations ───────────────────────────────────────────────────────

export async function listConversations(
  userId: string,
  page: number,
  limit: number,
): Promise<{ conversations: ConversationItem[]; total: number }> {
  const offset = (page - 1) * limit;

  // Get all conversation IDs for this user with their unread counts
  const participantRows = await db
    .select({
      conversationId: conversationParticipants.conversationId,
      unreadCount: conversationParticipants.unreadCount,
    })
    .from(conversationParticipants)
    .where(eq(conversationParticipants.userId, userId));

  const total = participantRows.length;

  if (total === 0) {
    return { conversations: [], total: 0 };
  }

  // Get conversations ordered by updatedAt desc with pagination
  const convRows = await db
    .select({
      id: conversations.id,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .innerJoin(
      conversationParticipants,
      and(
        eq(conversationParticipants.conversationId, conversations.id),
        eq(conversationParticipants.userId, userId),
      ),
    )
    .orderBy(desc(conversations.updatedAt))
    .limit(limit)
    .offset(offset);

  const result: ConversationItem[] = [];

  for (const conv of convRows) {
    // Get the other participant
    const [otherParticipant] = await db
      .select({ userId: conversationParticipants.userId })
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conv.id),
          ne(conversationParticipants.userId, userId),
        ),
      )
      .limit(1);

    if (!otherParticipant) continue;

    const [otherUser] = await db
      .select({
        id: users.id,
        name: users.name,
        specialization: users.specialization,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, otherParticipant.userId))
      .limit(1);

    // Get the most recent message
    const [lastMsg] = await db
      .select({ body: messages.body, createdAt: messages.createdAt })
      .from(messages)
      .where(eq(messages.conversationId, conv.id))
      .orderBy(desc(messages.createdAt))
      .limit(1);

    const unreadRow = participantRows.find((r) => r.conversationId === conv.id);

    result.push({
      id: conv.id,
      otherUser: otherUser
        ? {
            id: otherUser.id,
            name: otherUser.name,
            specialization: otherUser.specialization,
            avatarUrl: otherUser.avatarUrl,
          }
        : { id: otherParticipant.userId, name: null, specialization: null, avatarUrl: null },
      lastMessage: lastMsg?.body ?? '',
      lastMessageAt: lastMsg?.createdAt ?? null,
      unreadCount: unreadRow?.unreadCount ?? 0,
    });
  }

  return { conversations: result, total };
}

// ─── listMessages ────────────────────────────────────────────────────────────

export async function listMessages(
  conversationId: string,
  userId: string,
  page: number,
  limit: number,
): Promise<{ messages: Message[]; total: number }> {
  // Verify participant
  const [participant] = await db
    .select()
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId),
      ),
    )
    .limit(1);

  if (!participant) {
    throw new ForbiddenError('You are not a participant in this conversation');
  }

  const offset = (page - 1) * limit;

  const [msgList, totalResult] = await Promise.all([
    db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(eq(messages.conversationId, conversationId)),
  ]);

  const total = Number(totalResult[0]?.count ?? 0);
  return { messages: msgList, total };
}

// ─── sendMessage ─────────────────────────────────────────────────────────────

export async function sendMessage(
  conversationId: string,
  senderId: string,
  payload: {
    body: string;
    type?: string;
    attachmentUrl?: string;
    attachmentName?: string;
  },
): Promise<Message> {
  // Verify sender is a participant
  const [participant] = await db
    .select()
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, senderId),
      ),
    )
    .limit(1);

  if (!participant) {
    throw new ForbiddenError('You are not a participant in this conversation');
  }

  // Validate body is not whitespace-only
  if (!payload.body || payload.body.trim() === '') {
    throw new BadRequestError('Message body cannot be empty or whitespace');
  }

  // Validate attachment for image/file types
  const msgType = payload.type ?? 'text';
  if ((msgType === 'image' || msgType === 'file') && !payload.attachmentUrl) {
    throw new BadRequestError('attachmentUrl is required for image and file messages');
  }

  const id = createId();
  const now = new Date();

  await db.insert(messages).values({
    id,
    conversationId,
    senderId,
    body: payload.body,
    type: msgType as 'text' | 'image' | 'file',
    status: 'sent',
    attachmentUrl: payload.attachmentUrl ?? null,
    attachmentName: payload.attachmentName ?? null,
    createdAt: now,
  });

  // Update conversation updatedAt
  await db
    .update(conversations)
    .set({ updatedAt: now })
    .where(eq(conversations.id, conversationId));

  // Increment unreadCount for the OTHER participant
  await db
    .update(conversationParticipants)
    .set({ unreadCount: sql`${conversationParticipants.unreadCount} + 1` })
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        ne(conversationParticipants.userId, senderId),
      ),
    );

  const [msg] = await db
    .select()
    .from(messages)
    .where(eq(messages.id, id))
    .limit(1);

  return msg!;
}

// ─── markAsRead ──────────────────────────────────────────────────────────────

export async function markAsRead(
  conversationId: string,
  userId: string,
): Promise<void> {
  // Verify participant
  const [participant] = await db
    .select()
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId),
      ),
    )
    .limit(1);

  if (!participant) {
    throw new ForbiddenError('You are not a participant in this conversation');
  }

  // Set status = 'read' on all messages sent by the OTHER participant that are 'sent'
  await db
    .update(messages)
    .set({ status: 'read' })
    .where(
      and(
        eq(messages.conversationId, conversationId),
        ne(messages.senderId, userId),
        eq(messages.status, 'sent'),
      ),
    );

  // Reset unreadCount to 0 for this user
  await db
    .update(conversationParticipants)
    .set({ unreadCount: 0 })
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId),
      ),
    );
}
