const express = require('express');
const { z } = require('zod');
const { eq, desc } = require('drizzle-orm');
const { count } = require('drizzle-orm');
const { db, posts, users } = require('../db');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware, requireAdmin);

const authorCols = { id: users.id, name: users.name, specialization: users.specialization };

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

const userCols = { id: users.id, email: users.email, name: users.name, role: users.role, specialization: users.specialization, createdAt: users.createdAt };

router.get('/posts', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  const [postsList, totalResult] = await Promise.all([
    db.select(postWithAuthor()).from(posts).innerJoin(users, eq(posts.authorId, users.id)).orderBy(desc(posts.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(posts),
  ]);
  const total = Number(totalResult[0]?.count ?? 0);
  res.json({ posts: postsList, total, page, limit });
});

const updatePostSchema = z.object({ isRemoved: z.boolean().optional(), isPublished: z.boolean().optional() });

router.patch('/posts/:id', async (req, res) => {
  try {
    const body = updatePostSchema.parse(req.body);
    await db.update(posts).set(body).where(eq(posts.id, req.params.id));
    const [post] = await db.select(postWithAuthor()).from(posts).innerJoin(users, eq(posts.authorId, users.id)).where(eq(posts.id, req.params.id)).limit(1);
    return res.json(post);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: err.errors });
    throw err;
  }
});

router.get('/users', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  const [usersList, totalResult] = await Promise.all([
    db.select(userCols).from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(users),
  ]);
  const total = Number(totalResult[0]?.count ?? 0);
  res.json({ users: usersList, total, page, limit });
});

module.exports = router;
