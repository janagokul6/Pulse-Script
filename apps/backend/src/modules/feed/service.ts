import { and, desc, eq, inArray } from 'drizzle-orm';
import { count } from 'drizzle-orm';
import { db, posts, users, follows } from '../../db/index.js';
import { postWithAuthorSelection } from '../posts/service.js';

export interface ListFeedParams {
  page: number;
  limit: number;
  sort: 'latest' | 'following';
  specialty?: string;
  currentUserId?: string;
}

export async function listFeed(params: ListFeedParams) {
  const { page, limit, sort, specialty, currentUserId } = params;
  const offset = (page - 1) * limit;
  const baseWhere = and(eq(posts.isPublished, true), eq(posts.isRemoved, false));
  if (sort === 'following' && currentUserId) {
    const followingRows = await db
      .select({ followingId: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, currentUserId));
    const followingIds = followingRows.map((r) => r.followingId);
    if (followingIds.length === 0) {
      const where = specialty ? and(baseWhere, eq(posts.specialty, specialty)) : baseWhere;
      const [postsList, totalResult] = await Promise.all([
        db
          .select(postWithAuthorSelection())
          .from(posts)
          .innerJoin(users, eq(posts.authorId, users.id))
          .where(where)
          .orderBy(desc(posts.createdAt))
          .limit(limit)
          .offset(0),
        db.select({ count: count() }).from(posts).where(where),
      ]);
      return { posts: postsList, total: Number(totalResult[0]?.count ?? 0), page, limit };
    }
    const where = specialty
      ? and(baseWhere, eq(posts.specialty, specialty), inArray(posts.authorId, followingIds))
      : and(baseWhere, inArray(posts.authorId, followingIds));
    const [postsList, totalResult] = await Promise.all([
      db
        .select(postWithAuthorSelection())
        .from(posts)
        .innerJoin(users, eq(posts.authorId, users.id))
        .where(where)
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(posts).where(where),
    ]);
    return { posts: postsList, total: Number(totalResult[0]?.count ?? 0), page, limit };
  }
  const where = specialty ? and(baseWhere, eq(posts.specialty, specialty)) : baseWhere;
  const [postsList, totalResult] = await Promise.all([
    db
      .select(postWithAuthorSelection())
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(where)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(posts).where(where),
  ]);
  return { posts: postsList, total: Number(totalResult[0]?.count ?? 0), page, limit };
}
