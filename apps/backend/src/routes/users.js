const express = require('express');
const { z } = require('zod');
const { eq, and } = require('drizzle-orm');
const { db, users, follows } = require('../db');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

const publicUserCols = {
  id: users.id,
  name: users.name,
  specialization: users.specialization,
  experienceYears: users.experienceYears,
  bio: users.bio,
  avatarUrl: users.avatarUrl,
  createdAt: users.createdAt,
};

const meCols = {
  id: users.id,
  email: users.email,
  name: users.name,
  role: users.role,
  specialization: users.specialization,
  experienceYears: users.experienceYears,
  bio: users.bio,
  avatarUrl: users.avatarUrl,
  createdAt: users.createdAt,
};

router.get('/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

const updateMeSchema = z.object({
  name: z.string().min(1).optional(),
  specialization: z.string().optional(),
  experienceYears: z.number().int().min(0).optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

router.patch('/me', authMiddleware, async (req, res) => {
  try {
    const body = updateMeSchema.parse(req.body);
    const [user] = await db.update(users).set(body).where(eq(users.id, req.user.id)).returning(meCols);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: err.errors });
    throw err;
  }
});

router.get('/me/following', authMiddleware, async (req, res) => {
  const list = await db
    .select({
      id: users.id,
      name: users.name,
      specialization: users.specialization,
      avatarUrl: users.avatarUrl,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followingId, users.id))
    .where(eq(follows.followerId, req.user.id));
  return res.json({ following: list });
});

router.get('/:id', optionalAuth, async (req, res) => {
  const [user] = await db.select(publicUserCols).from(users).where(eq(users.id, req.params.id)).limit(1);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const out = { ...user };
  if (req.user && req.user.id !== user.id) {
    const [f] = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, req.user.id), eq(follows.followingId, req.params.id)))
      .limit(1);
    out.isFollowing = !!f;
  }
  res.json(out);
});

module.exports = router;
