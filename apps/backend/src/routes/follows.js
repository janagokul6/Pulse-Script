const express = require('express');
const { eq, and } = require('drizzle-orm');
const { db, users, follows } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  const followingId = req.params.userId;
  if (followingId === req.user.id) return res.status(400).json({ error: 'Cannot follow yourself' });
  const [user] = await db.select().from(users).where(eq(users.id, followingId)).limit(1);
  if (!user) return res.status(404).json({ error: 'User not found' });
  await db.insert(follows).values({ followerId: req.user.id, followingId }).onConflictDoNothing({ target: [follows.followerId, follows.followingId] });
  return res.status(204).send();
});

router.delete('/', authMiddleware, async (req, res) => {
  await db.delete(follows).where(and(eq(follows.followerId, req.user.id), eq(follows.followingId, req.params.userId)));
  return res.status(204).send();
});

router.get('/', authMiddleware, async (req, res) => {
  const list = await db
    .select({ id: users.id, name: users.name, specialization: users.specialization, avatarUrl: users.avatarUrl })
    .from(follows)
    .innerJoin(users, eq(follows.followingId, users.id))
    .where(eq(follows.followerId, req.user.id));
  return res.json({ following: list });
});

module.exports = router;
