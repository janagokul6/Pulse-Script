import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { followUser, unfollowUser, listFollowing } from './service.js';

export async function follow(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest & { params: { userId: string } };
  await followUser(authReq.user.id, authReq.params.userId);
  res.status(204).send();
}

export async function unfollow(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest & { params: { userId: string } };
  await unfollowUser(authReq.user.id, authReq.params.userId);
  res.status(204).send();
}

export async function list(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const following = await listFollowing(authReq.user.id);
  res.json({ following });
}
