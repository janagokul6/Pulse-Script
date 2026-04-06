import { eq, desc } from 'drizzle-orm';
import { count } from 'drizzle-orm';
import { db, posts, users } from '../../db/index.js';
import { NotFoundError } from '../../lib/errors.js';
import { postWithAuthorSelection } from '../posts/service.js';

const userCols = {
  id: users.id,
  email: users.email,
  name: users.name,
  role: users.role,
  specialization: users.specialization,
  createdAt: users.createdAt,
};

export async function listAllPostsForAdmin(params: { page: number; limit: number }) {
  const { page, limit } = params;
  const offset = (page - 1) * limit;
  const [postsList, totalResult] = await Promise.all([
    db
      .select(postWithAuthorSelection())
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(posts),
  ]);
  const total = Number(totalResult[0]?.count ?? 0);
  return { posts: postsList, total, page, limit };
}

export async function updatePostModeration(
  postId: string,
  data: { isRemoved?: boolean; isPublished?: boolean },
) {
  const [existing] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!existing) throw new NotFoundError('Post not found');
  await db.update(posts).set(data).where(eq(posts.id, postId));
  const [post] = await db
    .select(postWithAuthorSelection())
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.id, postId))
    .limit(1);
  if (!post) throw new NotFoundError('Post not found');
  return post;
}

export async function listUsers(params: { page: number; limit: number }) {
  const { page, limit } = params;
  const offset = (page - 1) * limit;
  const [usersList, totalResult] = await Promise.all([
    db.select(userCols).from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(users),
  ]);
  const total = Number(totalResult[0]?.count ?? 0);
  return { users: usersList, total, page, limit };
}
