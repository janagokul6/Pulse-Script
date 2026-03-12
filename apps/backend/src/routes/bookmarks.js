const express = require('express');
const { eq, and } = require('drizzle-orm');
const { desc } = require('drizzle-orm');
const { db, bookmarks, posts, users } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const authorCols = { id: users.id, name: users.name, specialization: users.specialization, avatarUrl: users.avatarUrl };

function postWithAuthor() {
  return {
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
  };
}

router.get('/', authMiddleware, async (req, res) => {
  const rows = await db
    .select(postWithAuthor())
    .from(bookmarks)
    .innerJoin(posts, eq(bookmarks.postId, posts.id))
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(bookmarks.userId, req.user.id))
    .orderBy(desc(bookmarks.createdAt));
  const postsList = rows.map((r) => ({ ...r, author: r.author })).filter((p) => !p.isRemoved);
  return res.json({ posts: postsList });
});

router.post('/:postId', authMiddleware, async (req, res) => {
  const postId = req.params.postId || req.params.id;
  const [post] = await db.select().from(posts).where(and(eq(posts.id, postId), eq(posts.isPublished, true), eq(posts.isRemoved, false))).limit(1);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  await db.insert(bookmarks).values({ userId: req.user.id, postId }).onConflictDoNothing({ target: [bookmarks.userId, bookmarks.postId] });
  return res.status(204).send();
});

router.delete('/:postId', authMiddleware, async (req, res) => {
  await db.delete(bookmarks).where(and(eq(bookmarks.userId, req.user.id), eq(bookmarks.postId, req.params.postId)));
  return res.status(204).send();
});

module.exports = router;
