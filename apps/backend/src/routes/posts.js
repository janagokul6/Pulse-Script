const express = require('express');
const multer = require('multer');
const { z } = require('zod');
const OpenAI = require('openai').default;
const { toFile } = require('openai');
const { eq, and, desc } = require('drizzle-orm');
const { count } = require('drizzle-orm');
const { db, posts, users, bookmarks, follows, createId } = require('../db');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const commentRoutes = require('./comments');
const { createNotification } = require('../lib/notifications');

const router = express.Router();
router.use('/:postId/comments', commentRoutes);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

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

const createPostSchema = z.object({
  caseSummary: z.string().min(1),
  clinicalDecisions: z.string(),
  outcome: z.string(),
  keyLessons: z.string(),
  specialty: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const updatePostSchema = createPostSchema.partial();

router.post('/transcribe', authMiddleware, upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'Transcription not configured' });
  try {
    const openai = new OpenAI({ apiKey });
    const file = await toFile(req.file.buffer, req.file.originalname || 'audio.webm', { type: req.file.mimetype || 'audio/webm' });
    const transcript = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
    });
    const text = transcript.text || '';
    return res.json({
      transcript: text,
      draft: { caseSummary: text, clinicalDecisions: '', outcome: '', keyLessons: '', specialty: '', tags: [] },
    });
  } catch (err) {
    console.error('Transcribe error:', err);
    return res.status(500).json({ error: 'Transcription failed' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const body = createPostSchema.parse(req.body);
    const id = createId();
    await db.insert(posts).values({
      id,
      authorId: req.user.id,
      caseSummary: body.caseSummary,
      clinicalDecisions: body.clinicalDecisions,
      outcome: body.outcome,
      keyLessons: body.keyLessons,
      specialty: body.specialty ?? null,
      tags: body.tags || [],
    });
    const [post] = await db.select(postWithAuthorSelection()).from(posts).innerJoin(users, eq(posts.authorId, users.id)).where(eq(posts.id, id)).limit(1);
    if (!post) return res.status(500).json({ error: 'Failed to create post' });
    const followers = await db.select({ followerId: follows.followerId }).from(follows).where(eq(follows.followingId, req.user.id));
    const title = 'New case from someone you follow';
    const bodyText = `${req.user.name} shared a new case`;
    followers.forEach((f) => {
      createNotification({
        userId: f.followerId,
        type: 'new_post',
        referenceId: post.id,
        title,
        body: bodyText,
      }).catch((e) => console.error('Notification create error', e));
    });
    return res.status(201).json(post);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: err.errors });
    throw err;
  }
});

router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  const specialty = req.query.specialty ? String(req.query.specialty) : undefined;
  const authorId = req.query.authorId ? String(req.query.authorId) : undefined;

  let where = and(eq(posts.isPublished, true), eq(posts.isRemoved, false));
  if (specialty) where = and(where, eq(posts.specialty, specialty));
  if (authorId) where = and(where, eq(posts.authorId, authorId));

  const [postsList, totalResult] = await Promise.all([
    db.select(postWithAuthorSelection()).from(posts).innerJoin(users, eq(posts.authorId, users.id)).where(where).orderBy(desc(posts.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(posts).where(where),
  ]);
  const total = Number(totalResult[0]?.count ?? 0);
  res.json({ posts: postsList, total, page, limit });
});

router.get('/:id', optionalAuth, async (req, res) => {
  const [post] = await db.select(postWithAuthorSelection()).from(posts).innerJoin(users, eq(posts.authorId, users.id)).where(and(eq(posts.id, req.params.id), eq(posts.isRemoved, false))).limit(1);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (!post.isPublished && (!req.user || req.user.id !== post.authorId)) return res.status(404).json({ error: 'Post not found' });
  const out = { ...post };
  if (req.user) {
    const [b] = await db.select().from(bookmarks).where(and(eq(bookmarks.userId, req.user.id), eq(bookmarks.postId, req.params.id))).limit(1);
    out.bookmarked = !!b;
  }
  res.json(out);
});

router.patch('/:id', authMiddleware, async (req, res) => {
  const [existing] = await db.select().from(posts).where(eq(posts.id, req.params.id)).limit(1);
  if (!existing) return res.status(404).json({ error: 'Post not found' });
  if (existing.authorId !== req.user.id) return res.status(403).json({ error: 'Not allowed to edit this post' });
  try {
    const body = updatePostSchema.parse(req.body);
    await db.update(posts).set(body).where(eq(posts.id, req.params.id));
    const [post] = await db.select(postWithAuthorSelection()).from(posts).innerJoin(users, eq(posts.authorId, users.id)).where(eq(posts.id, req.params.id)).limit(1);
    return res.json(post);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: err.errors });
    throw err;
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  const [existing] = await db.select().from(posts).where(eq(posts.id, req.params.id)).limit(1);
  if (!existing) return res.status(404).json({ error: 'Post not found' });
  if (existing.authorId !== req.user.id) return res.status(403).json({ error: 'Not allowed to delete this post' });
  await db.update(posts).set({ isPublished: false }).where(eq(posts.id, req.params.id));
  return res.status(204).send();
});

router.post('/:id/bookmark', authMiddleware, async (req, res) => {
  const [post] = await db.select().from(posts).where(and(eq(posts.id, req.params.id), eq(posts.isPublished, true), eq(posts.isRemoved, false))).limit(1);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  await db.insert(bookmarks).values({ userId: req.user.id, postId: req.params.id }).onConflictDoNothing({ target: [bookmarks.userId, bookmarks.postId] });
  return res.status(204).send();
});

router.delete('/:id/bookmark', authMiddleware, async (req, res) => {
  await db.delete(bookmarks).where(and(eq(bookmarks.userId, req.user.id), eq(bookmarks.postId, req.params.id)));
  return res.status(204).send();
});

module.exports = router;
