import OpenAI from 'openai';
import { toFile } from 'openai';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { count } from 'drizzle-orm';
import { db, posts, users, bookmarks, follows, comments, createId } from '../../db/index.js';
import { createNotification } from '../../lib/notifications.js';
import { NotFoundError, ForbiddenError, BadRequestError, InternalError } from '../../lib/errors.js';
import type { CreatePostInput } from './schemas.js';

const authorCols = {
  id: users.id,
  name: users.name,
  specialization: users.specialization,
  avatarUrl: users.avatarUrl,
};

export function postWithAuthorSelection() {
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
    commentCount: sql<number>`(SELECT COUNT(*) FROM ${comments} WHERE ${comments.postId} = ${posts.id})`.as('comment_count'),
  };
}

export async function transcribeAudio(
  file: Express.Multer.File,
  apiKey: string,
): Promise<{ transcript: string; draft: Record<string, unknown> }> {
  const openai = new OpenAI({ apiKey });
  const convertedFile = await toFile(file.buffer, file.originalname || 'audio.webm', {
    type: file.mimetype || 'audio/webm',
  });
  const transcript = await openai.audio.transcriptions.create({
    file: convertedFile,
    model: 'whisper-1',
  });
  const text = (transcript as { text?: string }).text ?? '';
  let draft: {
    caseSummary: string;
    clinicalDecisions: string;
    outcome: string;
    keyLessons: string;
    specialty: string;
    tags: string[];
  };
  try {
    draft = await structureRawText(text, apiKey);
  } catch {
    draft = {
      caseSummary: text,
      clinicalDecisions: '',
      outcome: '',
      keyLessons: '',
      specialty: '',
      tags: [],
    };
  }
  return { transcript: text, draft };
}

const STRUCTURE_SYSTEM_PROMPT = `You are a medical documentation assistant. Given raw clinical notes, extract and rewrite them into a structured clinical case with these fields:
- caseSummary: A clear, professional summary of the patient presentation and clinical findings.
- clinicalDecisions: Key diagnostic and treatment decisions made during the case.
- outcome: The result or current status of the patient.
- keyLessons: Important takeaways for other clinicians.
- specialty: The most relevant medical specialty (e.g. "Cardiology", "Neurology").
- tags: An array of 2-5 short relevant tags (e.g. ["acute", "ECG", "rare"]).

Respond ONLY with valid JSON matching this exact shape:
{"caseSummary":"","clinicalDecisions":"","outcome":"","keyLessons":"","specialty":"","tags":[]}
Do not include any text outside the JSON. If a field cannot be determined from the input, provide a reasonable empty string for text fields or empty array for tags.`;

export async function structureRawText(
  rawText: string,
  apiKey: string,
): Promise<{
  caseSummary: string;
  clinicalDecisions: string;
  outcome: string;
  keyLessons: string;
  specialty: string;
  tags: string[];
}> {
  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: STRUCTURE_SYSTEM_PROMPT },
      { role: 'user', content: rawText },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });
  const content = completion.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(content);
  return {
    caseSummary: parsed.caseSummary ?? '',
    clinicalDecisions: parsed.clinicalDecisions ?? '',
    outcome: parsed.outcome ?? '',
    keyLessons: parsed.keyLessons ?? '',
    specialty: parsed.specialty ?? '',
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
  };
}

export async function createPostForAuthor(
  authorId: string,
  authorName: string,
  data: CreatePostInput,
) {
  const id = createId();
  await db.insert(posts).values({
    id,
    authorId,
    caseSummary: data.caseSummary,
    clinicalDecisions: data.clinicalDecisions,
    outcome: data.outcome,
    keyLessons: data.keyLessons,
    specialty: data.specialty ?? null,
    tags: data.tags ?? [],
  });
  const [post] = await db
    .select(postWithAuthorSelection())
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.id, id))
    .limit(1);
  if (!post) throw new InternalError('Failed to create post');
  const followersRows = await db
    .select({ followerId: follows.followerId })
    .from(follows)
    .where(eq(follows.followingId, authorId));
  const title = 'New case from someone you follow';
  const bodyText = `${authorName} shared a new case`;
  for (const f of followersRows) {
    createNotification({
      userId: f.followerId,
      type: 'new_post',
      referenceId: post.id,
      title,
      body: bodyText,
    }).catch((e) => console.error('Notification create error', e));
  }
  return post;
}

export interface ListPostsParams {
  page: number;
  limit: number;
  specialty?: string;
  authorId?: string;
}

export async function listPosts(params: ListPostsParams) {
  const { page, limit, specialty, authorId } = params;
  const offset = (page - 1) * limit;
  let where = and(eq(posts.isPublished, true), eq(posts.isRemoved, false));
  if (specialty) where = and(where, eq(posts.specialty, specialty));
  if (authorId) where = and(where, eq(posts.authorId, authorId));
  const [postsList, totalResult] = await Promise.all([
    db
      .select(postWithAuthorSelection())
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(where)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(posts).where(where),
  ]);
  const total = Number(totalResult[0]?.count ?? 0);
  return { posts: postsList, total, page, limit };
}

export async function getPostWithBookmarkMeta(postId: string, currentUserId?: string) {
  const [post] = await db
    .select(postWithAuthorSelection())
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(and(eq(posts.id, postId), eq(posts.isRemoved, false)))
    .limit(1);
  if (!post) return null;
  const out: Record<string, unknown> = { ...post };
  if (currentUserId) {
    const [b] = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.userId, currentUserId), eq(bookmarks.postId, postId)))
      .limit(1);
    (out as { bookmarked: boolean }).bookmarked = !!b;
  }
  return out;
}

export async function updatePostForAuthor(
  postId: string,
  authorId: string,
  data: Partial<CreatePostInput>,
) {
  const [existing] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!existing) throw new NotFoundError('Post not found');
  if (existing.authorId !== authorId) throw new ForbiddenError('Not allowed to edit this post');
  await db.update(posts).set(data).where(eq(posts.id, postId));
  const [post] = await db
    .select(postWithAuthorSelection())
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.id, postId))
    .limit(1);
  if (!post) throw new InternalError('Failed to load post');
  return post;
}

export async function softDeletePostForAuthor(postId: string, authorId: string): Promise<void> {
  const [existing] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!existing) throw new NotFoundError('Post not found');
  if (existing.authorId !== authorId) throw new ForbiddenError('Not allowed to delete this post');
  await db.update(posts).set({ isPublished: false }).where(eq(posts.id, postId));
}
