import {
  pgTable,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  primaryKey,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('Role', ['doctor', 'junior', 'student', 'admin']);

export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).unique(),
  email: varchar('email', { length: 255 }),
  name: varchar('name', { length: 255 }).notNull(),
  specialization: varchar('specialization', { length: 255 }),
  experienceYears: integer('experience_years'),
  bio: text('bio'),
  role: roleEnum('role').default('doctor').notNull(),
  avatarUrl: varchar('avatar_url', { length: 512 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const posts = pgTable('posts', {
  id: varchar('id', { length: 255 }).primaryKey(),
  authorId: varchar('author_id', { length: 255 }).notNull(),
  caseSummary: text('case_summary').notNull(),
  clinicalDecisions: text('clinical_decisions').notNull(),
  outcome: text('outcome').notNull(),
  keyLessons: text('key_lessons').notNull(),
  specialty: varchar('specialty', { length: 255 }),
  tags: text('tags').array().default([]).notNull(),
  isPublished: boolean('is_published').default(true).notNull(),
  isRemoved: boolean('is_removed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const comments = pgTable('comments', {
  id: varchar('id', { length: 255 }).primaryKey(),
  postId: varchar('post_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  parentId: varchar('parent_id', { length: 255 }),
  body: text('body').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const bookmarks = pgTable(
  'bookmarks',
  {
    userId: varchar('user_id', { length: 255 }).notNull(),
    postId: varchar('post_id', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.postId] })],
);

export const follows = pgTable(
  'follows',
  {
    followerId: varchar('follower_id', { length: 255 }).notNull(),
    followingId: varchar('following_id', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.followerId, t.followingId] })],
);

export const notifications = pgTable('notifications', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  type: varchar('type', { length: 255 }).notNull(),
  referenceId: varchar('reference_id', { length: 255 }),
  title: varchar('title', { length: 512 }),
  body: text('body'),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  token: varchar('token', { length: 1024 }).unique().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export const commentLikes = pgTable(
  'comment_likes',
  {
    commentId: varchar('comment_id', { length: 255 }).notNull(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.commentId, t.userId] })],
);

export type CommentLike = typeof commentLikes.$inferSelect;
export type NewCommentLike = typeof commentLikes.$inferInsert;

export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;
export type Follow = typeof follows.$inferSelect;
export type NewFollow = typeof follows.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;

// Messaging
export const messageTypeEnum = pgEnum('MessageType', ['text', 'image', 'file']);
export const messageStatusEnum = pgEnum('MessageStatus', ['sent', 'read']);

export const conversations = pgTable('conversations', {
  id: varchar('id', { length: 255 }).primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const conversationParticipants = pgTable(
  'conversation_participants',
  {
    conversationId: varchar('conversation_id', { length: 255 }).notNull(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    unreadCount: integer('unread_count').default(0).notNull(),
    lastReadAt: timestamp('last_read_at'),
  },
  (t) => [primaryKey({ columns: [t.conversationId, t.userId] })],
);

export const messages = pgTable('messages', {
  id: varchar('id', { length: 255 }).primaryKey(),
  conversationId: varchar('conversation_id', { length: 255 }).notNull(),
  senderId: varchar('sender_id', { length: 255 }).notNull(),
  body: text('body').notNull().default(''),
  type: messageTypeEnum('type').default('text').notNull(),
  status: messageStatusEnum('status').default('sent').notNull(),
  attachmentUrl: varchar('attachment_url', { length: 1024 }),
  attachmentName: varchar('attachment_name', { length: 512 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
