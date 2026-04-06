import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import {
  listAllPostsForAdmin,
  updatePostModeration,
  listUsers,
} from './service.js';

export async function listPosts(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20));
  const result = await listAllPostsForAdmin({ page, limit });
  res.json(result);
}

export async function updatePost(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest & { params: { id: string }; validated: { isRemoved?: boolean; isPublished?: boolean } };
  const post = await updatePostModeration(authReq.params.id, authReq.validated);
  res.json(post);
}

export async function listUsersHandler(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20));
  const result = await listUsers({ page, limit });
  res.json(result);
}
