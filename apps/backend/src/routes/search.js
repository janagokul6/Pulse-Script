const express = require('express');
const { eq, and, or, ilike, desc } = require('drizzle-orm');
const { count } = require('drizzle-orm');
const { db, posts, users } = require('../db');

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

router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  const q = (req.query.q || req.query.search || '').trim();
  const specialty = req.query.specialty ? String(req.query.specialty) : undefined;

  let where = and(eq(posts.isPublished, true), eq(posts.isRemoved, false));
  if (specialty) where = and(where, eq(posts.specialty, specialty));
  if (q.length > 0) {
    const pattern = `%${q}%`;
    where = and(
      where,
      or(
        ilike(posts.caseSummary, pattern),
        ilike(posts.clinicalDecisions, pattern),
        ilike(posts.outcome, pattern),
        ilike(posts.keyLessons, pattern),
        ilike(posts.specialty, pattern)
      )
    );
  }

  const [postsList, totalResult] = await Promise.all([
    db.select(postWithAuthor()).from(posts).innerJoin(users, eq(posts.authorId, users.id)).where(where).orderBy(desc(posts.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(posts).where(where),
  ]);
  const total = Number(totalResult[0]?.count ?? 0);
  res.json({ posts: postsList, total, page, limit });
});

module.exports = router;
