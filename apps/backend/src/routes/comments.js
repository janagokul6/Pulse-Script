const express = require('express');
const { z } = require('zod');
const { eq, and, isNull, isNotNull } = require('drizzle-orm');
const { asc } = require('drizzle-orm');
const { db, comments, users, posts, createId } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { createNotification } = require('../lib/notifications');

const router = express.Router({ mergeParams: true });

const userCols = { id: users.id, name: users.name, specialization: users.specialization, avatarUrl: users.avatarUrl };

const createSchema = z.object({ body: z.string().min(1).max(2000), parentId: z.string().optional() });

router.get('/', async (req, res) => {
  const postId = req.params.postId || req.params.id;
  const topLevel = await db
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
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(and(eq(comments.postId, postId), isNotNull(comments.parentId)))
    .orderBy(asc(comments.createdAt));
  const repliesByParent = {};
  const result = [];
  for (const r of replyRows) {
    if (r.parentId) {
      if (!repliesByParent[r.parentId]) repliesByParent[r.parentId] = [];
      repliesByParent[r.parentId].push({ id: r.id, postId: r.postId, userId: r.userId, parentId: r.parentId, body: r.body, createdAt: r.createdAt, user: r.user, replies: [] });
    }
  }
  for (const r of topLevel) {
    result.push({
      id: r.id,
      postId: r.postId,
      userId: r.userId,
      parentId: r.parentId,
      body: r.body,
      createdAt: r.createdAt,
      user: r.user,
      replies: repliesByParent[r.id] || [],
    });
  }
  res.json({ comments: result });
});

router.post('/', authMiddleware, async (req, res) => {
  const postId = req.params.postId || req.params.id;
  const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post || post.isRemoved) return res.status(404).json({ error: 'Post not found' });
  try {
    const body = createSchema.parse(req.body);
    const id = createId();
    await db.insert(comments).values({
      id,
      postId,
      userId: req.user.id,
      body: body.body,
      parentId: body.parentId || null,
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
    if (!row) return res.status(500).json({ error: 'Failed to create comment' });
    const comment = { ...row, replies: [] };
    if (post.authorId !== req.user.id) {
      createNotification({
        userId: post.authorId,
        type: body.parentId ? 'reply' : 'comment',
        referenceId: postId,
        title: 'New comment',
        body: `${req.user.name} commented on your case`,
      }).catch((e) => console.error('Notification create error', e));
    }
    return res.status(201).json(comment);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: err.errors });
    throw err;
  }
});

router.patch('/:commentId', authMiddleware, async (req, res) => {
  const [comment] = await db.select().from(comments).where(eq(comments.id, req.params.commentId)).limit(1);
  if (!comment || comment.userId !== req.user.id) return res.status(404).json({ error: 'Comment not found' });
  const body = z.object({ body: z.string().min(1).max(2000) }).parse(req.body);
  await db.update(comments).set({ body: body.body }).where(eq(comments.id, req.params.commentId));
  const [updated] = await db
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
    .where(eq(comments.id, req.params.commentId))
    .limit(1);
  const out = { ...updated, replies: [] };
  return res.json(out);
});

router.delete('/:commentId', authMiddleware, async (req, res) => {
  const [comment] = await db.select().from(comments).where(eq(comments.id, req.params.commentId)).limit(1);
  if (!comment || comment.userId !== req.user.id) return res.status(404).json({ error: 'Comment not found' });
  await db.delete(comments).where(eq(comments.id, req.params.commentId));
  return res.status(204).send();
});

module.exports = router;
