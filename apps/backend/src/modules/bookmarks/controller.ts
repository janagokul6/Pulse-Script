import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { BadRequestError } from '../../lib/errors.js';
import { addBookmark, removeBookmark, listBookmarks } from './service.js';

export async function list(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const posts = await listBookmarks(authReq.user.id);
  res.json({ posts });
}

export async function add(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest & { params: { postId?: string; id?: string } };
  const postId = authReq.params.postId ?? authReq.params.id;
  if (!postId) throw new BadRequestError('Post ID required');
  await addBookmark(postId, authReq.user.id);
  res.status(204).send();
}

export async function remove(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest & { params: { postId?: string; id?: string } };
  const postId = authReq.params.postId ?? authReq.params.id;
  if (!postId) throw new BadRequestError('Post ID required');
  await removeBookmark(postId, authReq.user.id);
  res.status(204).send();
}
