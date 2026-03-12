const express = require('express');
const { z } = require('zod');
const { eq, and, isNull } = require('drizzle-orm');
const { desc } = require('drizzle-orm');
const { count } = require('drizzle-orm');
const { db, notifications, pushSubscriptions, createId } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  const unreadOnly = req.query.unread === 'true';

  let where = eq(notifications.userId, req.user.id);
  if (unreadOnly) where = and(where, isNull(notifications.readAt));

  const [list, totalResult] = await Promise.all([
    db.select().from(notifications).where(where).orderBy(desc(notifications.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(notifications).where(where),
  ]);
  const total = Number(totalResult[0]?.count ?? 0);
  res.json({ notifications: list, total, page, limit });
});

router.patch('/read-all', authMiddleware, async (req, res) => {
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.userId, req.user.id), isNull(notifications.readAt)));
  return res.status(204).send();
});

router.patch('/:id/read', authMiddleware, async (req, res) => {
  const [n] = await db.select().from(notifications).where(and(eq(notifications.id, req.params.id), eq(notifications.userId, req.user.id))).limit(1);
  if (!n) return res.status(404).json({ error: 'Not found' });
  await db.update(notifications).set({ readAt: new Date() }).where(eq(notifications.id, req.params.id));
  return res.status(204).send();
});

const registerSchema = z.object({ token: z.string().min(1) });

router.post('/register-device', authMiddleware, async (req, res) => {
  try {
    const body = registerSchema.parse(req.body);
    await db
      .insert(pushSubscriptions)
      .values({ id: createId(), userId: req.user.id, token: body.token })
      .onConflictDoUpdate({ target: pushSubscriptions.token, set: { userId: req.user.id } });
    return res.status(204).send();
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: err.errors });
    throw err;
  }
});

module.exports = router;
