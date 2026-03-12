const express = require('express');
const { eq, and, inArray, desc } = require('drizzle-orm');
const { count } = require('drizzle-orm');
const { db, posts, users, follows } = require('../db');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

const authorCols = { id: users.id, name: users.name, specialization: users.specialization, avatarUrl: users.avatarUrl };

function postWithAuthorSelection() {
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

router.get('/', optionalAuth, async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  const sort = req.query.sort === 'following' ? 'following' : 'latest';
  const specialty = req.query.specialty ? String(req.query.specialty) : undefined;

  const baseWhere = and(eq(posts.isPublished, true), eq(posts.isRemoved, false));

  if (sort === 'following' && req.user) {
    const followingRows = await db.select({ followingId: follows.followingId }).from(follows).where(eq(follows.followerId, req.user.id));
    const followingIds = followingRows.map((r) => r.followingId);
    if (followingIds.length === 0) {
      const where = specialty ? and(baseWhere, eq(posts.specialty, specialty)) : baseWhere;
      const [postsList, totalResult] = await Promise.all([
        db.select(postWithAuthorSelection()).from(posts).innerJoin(users, eq(posts.authorId, users.id)).where(where).orderBy(desc(posts.createdAt)).limit(limit).offset(0),
        db.select({ count: count() }).from(posts).where(where),
      ]);
      const total = Number(totalResult[0]?.count ?? 0);
      return res.json({ posts: postsList, total, page, limit });
    }
    const where = specialty ? and(baseWhere, eq(posts.specialty, specialty), inArray(posts.authorId, followingIds)) : and(baseWhere, inArray(posts.authorId, followingIds));
    const [postsList, totalResult] = await Promise.all([
      db.select(postWithAuthorSelection()).from(posts).innerJoin(users, eq(posts.authorId, users.id)).where(where).orderBy(desc(posts.createdAt)).limit(limit).offset(offset),
      db.select({ count: count() }).from(posts).where(where),
    ]);
    const total = Number(totalResult[0]?.count ?? 0);
    return res.json({ posts: postsList, total, page, limit });
  }

  const where = specialty ? and(baseWhere, eq(posts.specialty, specialty)) : baseWhere;
  const [postsList, totalResult] = await Promise.all([
    db.select(postWithAuthorSelection()).from(posts).innerJoin(users, eq(posts.authorId, users.id)).where(where).orderBy(desc(posts.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(posts).where(where),
  ]);
  const total = Number(totalResult[0]?.count ?? 0);
  res.json({ posts: postsList, total, page, limit });
});

module.exports = router;
