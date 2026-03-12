const {
  pgTable,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  primaryKey,
  pgEnum,
} = require('drizzle-orm/pg-core');

const roleEnum = pgEnum('Role', ['doctor', 'junior', 'student', 'admin']);

const users = pgTable('users', {
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

const posts = pgTable('posts', {
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

const comments = pgTable('comments', {
  id: varchar('id', { length: 255 }).primaryKey(),
  postId: varchar('post_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  parentId: varchar('parent_id', { length: 255 }),
  body: text('body').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

const bookmarks = pgTable(
  'bookmarks',
  {
    userId: varchar('user_id', { length: 255 }).notNull(),
    postId: varchar('post_id', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.postId] })]
);

const follows = pgTable(
  'follows',
  {
    followerId: varchar('follower_id', { length: 255 }).notNull(),
    followingId: varchar('following_id', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.followerId, t.followingId] })]
);

const notifications = pgTable('notifications', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  type: varchar('type', { length: 255 }).notNull(),
  referenceId: varchar('reference_id', { length: 255 }),
  title: varchar('title', { length: 512 }),
  body: text('body'),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

const pushSubscriptions = pgTable('push_subscriptions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  token: varchar('token', { length: 1024 }).unique().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

module.exports = {
  users,
  posts,
  comments,
  bookmarks,
  follows,
  notifications,
  pushSubscriptions,
  roleEnum,
};
