import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { config } from '../../config/index.js';
import { BadRequestError, NotFoundError } from '../../lib/errors.js';
import {
  transcribeAudio,
  structureRawText,
  createPostForAuthor,
  listPosts,
  getPostWithBookmarkMeta,
  updatePostForAuthor,
  softDeletePostForAuthor,
} from './service.js';
import { addBookmark, removeBookmark } from '../bookmarks/service.js';

export async function transcribe(req: Request, res: Response): Promise<void> {
  const r = req as AuthenticatedRequest & { file?: Express.Multer.File };
  if (!r.file) throw new BadRequestError('No audio file uploaded');
  const apiKey = config.OPENAI_API_KEY;
  if (!apiKey) throw new BadRequestError('Transcription not configured');
  const result = await transcribeAudio(r.file, apiKey);
  res.json(result);
}

export async function aiStructure(req: Request, res: Response): Promise<void> {
  const r = req as AuthenticatedRequest & { validated: import('./schemas.js').AiStructureInput };
  const apiKey = config.OPENAI_API_KEY;
  if (!apiKey) throw new BadRequestError('AI structuring not configured');
  const result = await structureRawText(r.validated.rawText, apiKey);
  res.json(result);
}

export async function create(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest & { validated: import('./schemas.js').CreatePostInput };
  const post = await createPostForAuthor(authReq.user.id, authReq.user.name, authReq.validated);
  res.status(201).json(post);
}

export async function list(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20));
  const specialty = req.query.specialty ? String(req.query.specialty) : undefined;
  const authorId = req.query.authorId ? String(req.query.authorId) : undefined;
  const result = await listPosts({ page, limit, specialty, authorId });
  res.json(result);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const r = req as unknown as { params: { id: string }; user?: { id: string } };
  const out = await getPostWithBookmarkMeta(r.params.id, r.user?.id);
  if (!out) throw new NotFoundError('Post not found');
  const post = out as Record<string, unknown>;
  if (!post.isPublished && r.user?.id !== post.authorId) throw new NotFoundError('Post not found');
  res.json(out);
}

export async function update(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest & { params: { id: string }; validated: Partial<import('./schemas.js').CreatePostInput> };
  const post = await updatePostForAuthor(authReq.params.id, authReq.user.id, authReq.validated);
  res.json(post);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest & { params: { id: string } };
  await softDeletePostForAuthor(authReq.params.id, authReq.user.id);
  res.status(204).send();
}

export async function addBookmarkRoute(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest & { params: { id: string } };
  await addBookmark(authReq.params.id, authReq.user.id);
  res.status(204).send();
}

export async function removeBookmarkRoute(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest & { params: { id: string } };
  await removeBookmark(authReq.params.id, authReq.user.id);
  res.status(204).send();
}
