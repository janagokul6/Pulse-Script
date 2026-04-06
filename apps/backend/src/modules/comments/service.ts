import { eq, and, isNull, isNotNull, asc, sql, count } from 'drizzle-orm';
import { db, comments, users, posts, commentLikes, createId } from '../../db/index.js';
import { createNotification } from '../../lib/notifications.js';
import { NotFoundError, ForbiddenError } from '../../lib/errors.js';

const userCols = { id: users.id, name: users.name, specialization: users.specialization, avatarUrl: users.avatarUrl };

export interface CommentWithUser {
  id: string;
  postId: string;
  userId: string;
  parentId: string | null;
  body: string;
  createdAt: Date;
  likeCount: number;
  likedByMe: boolean;
  user: { id: string; name: string | null; specialization: string | null; avatarUrl: string | null };
  replies: CommentWithUser[];
}

export async function listCommentsForPost(postId: string, currentUserId?: string): Promise<CommentWithUser[]> {
  const likeCountSq = db
    .select({ commentId: commentLikes.commentId, likeCount: count().as('likeCount') })
    .from(commentLikes)
    .groupBy(commentLikes.commentId)
    .as('likeCounts');

  const topLevel = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      userId: comments.userId,
      parentId: comments.parentId,
      body: comments.body,
      createdAt: comments.createdAt,
      user: userCols,
      likeCount: sql<number>`COALESCE(${likeCountSq.likeCount}, 0)`,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .leftJoin(likeCountSq, eq(comments.id, likeCountSq.commentId))
    .where(and(eq(comments.postId, postId), isNull(comments.parentId)))
    .orderBy(asc(comments.createdAt));

  const replyRows = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      userId: comments.userId,
      parentId: comments.parentId,
      body: comments.body,
      createdAt: comments.createdAt,
      user: userCols,
      likeCount: sql<number>`COALESCE(${likeCountSq.likeCount}, 0)`,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .leftJoin(likeCountSq, eq(comments.id, likeCountSq.commentId))
    .where(and(eq(comments.postId, postId), isNotNull(comments.parentId)))
    .orderBy(asc(comments.createdAt));

  // Fetch liked comment IDs for the current user in one query
  let likedCommentIds = new Set<string>();
  if (currentUserId) {
    const liked = await db
      .select({ commentId: commentLikes.commentId })
      .from(commentLikes)
      .where(eq(commentLikes.userId, currentUserId));
    likedCommentIds = new Set(liked.map((l) => l.commentId));
  }

  const repliesByParent: Record<string, CommentWithUser[]> = {};
  for (const r of replyRows) {
    if (r.parentId) {
      if (!repliesByParent[r.parentId]) repliesByParent[r.parentId] = [];
      repliesByParent[r.parentId].push({
        ...r,
        likeCount: Number(r.likeCount),
        likedByMe: likedCommentIds.has(r.id),
        user: r.user,
        replies: [],
      });
    }
  }
  return topLevel.map((r) => ({
    ...r,
    likeCount: Number(r.likeCount),
    likedByMe: likedCommentIds.has(r.id),
    user: r.user,
    replies: repliesByParent[r.id] ?? [],
  }));
}

export async function createComment(params: {
  postId: string;
  userId: string;
  userName: string;
  body: string;
  parentId?: string;
}): Promise<CommentWithUser> {
  const [post] = await db.select().from(posts).where(eq(posts.id, params.postId)).limit(1);
  if (!post || post.isRemoved) throw new NotFoundError('Post not found');
  const id = createId();
  await db.insert(comments).values({
    id,
    postId: params.postId,
    userId: params.userId,
    body: params.body,
    parentId: params.parentId ?? null,
  });
  const [row] = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      userId: comments.userId,
      parentId: comments.parentId,
      body: comments.body,
      createdAt: comments.createdAt,
      user: userCols,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.id, id))
    .limit(1);
  if (!row) throw new Error('Failed to create comment');
  if (post.authorId !== params.userId) {
    createNotification({
      userId: post.authorId,
      type: params.parentId ? 'reply' : 'comment',
      referenceId: params.postId,
      title: 'New comment',
      body: `${params.userName} commented on your case`,
    }).catch((e) => console.error('Notification create error', e));
  }
  return { ...row, user: row.user, likeCount: 0, likedByMe: false, replies: [] };
}

export async function updateComment(commentId: string, userId: string, body: string): Promise<CommentWithUser> {
  const [comment] = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
  if (!comment || comment.userId !== userId) throw new NotFoundError('Comment not found');
  await db.update(comments).set({ body }).where(eq(comments.id, commentId));
  const [row] = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      userId: comments.userId,
      parentId: comments.parentId,
      body: comments.body,
      createdAt: comments.createdAt,
      user: userCols,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.id, commentId))
    .limit(1);
  if (!row) throw new NotFoundError('Comment not found');
  return { ...row, user: row.user, likeCount: 0, likedByMe: false, replies: [] };
}

export async function deleteComment(commentId: string, userId: string): Promise<void> {
  const [comment] = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
  if (!comment || comment.userId !== userId) throw new NotFoundError('Comment not found');
  // Cascade-delete replies before deleting the parent
  await db.delete(comments).where(eq(comments.parentId, commentId));
  await db.delete(comments).where(eq(comments.id, commentId));
}

export async function toggleCommentLike(commentId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
  const [existing] = await db
    .select()
    .from(commentLikes)
    .where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, userId)))
    .limit(1);

  if (existing) {
    await db.delete(commentLikes).where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, userId)));
  } else {
    await db.insert(commentLikes).values({ commentId, userId });
  }

  const [{ likeCount }] = await db
    .select({ likeCount: count() })
    .from(commentLikes)
    .where(eq(commentLikes.commentId, commentId));

  return { liked: !existing, likeCount: Number(likeCount) };
}
