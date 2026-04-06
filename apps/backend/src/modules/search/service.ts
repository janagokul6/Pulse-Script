import { and, desc, eq, or, ilike } from 'drizzle-orm';
import { count } from 'drizzle-orm';
import { db, posts, users } from '../../db/index.js';
import { postWithAuthorSelection } from '../posts/service.js';

export interface SearchParams {
  q: string;
  specialty?: string;
  page: number;
  limit: number;
}

export async function searchPosts(params: SearchParams) {
  const { q, specialty, page, limit } = params;
  const offset = (page - 1) * limit;
  let where = and(eq(posts.isPublished, true), eq(posts.isRemoved, false));
  if (specialty) where = and(where, eq(posts.specialty, specialty));
  if (q.trim().length > 0) {
    const pattern = `%${q.trim()}%`;
    where = and(
      where,
      or(
        ilike(posts.caseSummary, pattern),
        ilike(posts.clinicalDecisions, pattern),
        ilike(posts.outcome, pattern),
        ilike(posts.keyLessons, pattern),
        ilike(posts.specialty, pattern),
      ),
    );
  }
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
  const total = Number(totalResult[0]?.count ?? 0);
  return { posts: postsList, total, page, limit };
}
