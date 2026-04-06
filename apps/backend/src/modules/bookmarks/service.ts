import { eq, and, desc } from 'drizzle-orm';
import { db, bookmarks, posts, users } from '../../db/index.js';
import { NotFoundError } from '../../lib/errors.js';

const authorCols = { id: users.id, name: users.name, specialization: users.specialization, avatarUrl: users.avatarUrl };

export async function addBookmark(postId: string, userId: string): Promise<void> {
  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.isPublished, true), eq(posts.isRemoved, false)))
    .limit(1);
  if (!post) throw new NotFoundError('Post not found');
  await db
    .insert(bookmarks)
    .values({ userId, postId })
    .onConflictDoNothing({ target: [bookmarks.userId, bookmarks.postId] });
}

export async function removeBookmark(postId: string, userId: string): Promise<void> {
  await db.delete(bookmarks).where(and(eq(bookmarks.userId, userId), eq(bookmarks.postId, postId)));
}

export async function listBookmarks(userId: string) {
  const rows = await db
    .select({
      id: posts.id,
      authorId: posts.authorId,
      caseSummary: posts.caseSummary,
      clinicalDecisions: posts.clinicalDecisions,
      outcome: posts.outcome,
      keyLessons: posts.keyLessons,
      specialty: posts.specialty,
      tags: posts.tags,
      isPublished: posts.isPublished,
      isRemoved: posts.isRemoved,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      author: authorCols,
    })
    .from(bookmarks)
    .innerJoin(posts, eq(bookmarks.postId, posts.id))
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt));
  return rows.filter((r) => !r.isRemoved).map((r) => ({ ...r, author: r.author }));
}
