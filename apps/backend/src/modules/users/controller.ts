import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { NotFoundError } from '../../lib/errors.js';
import { getCurrentUser, updateCurrentUser, listCurrentUserFollowing, getPublicProfile } from './service.js';

export async function getMe(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const user = await getCurrentUser(authReq.user.id);
  if (!user) throw new NotFoundError('User not found');
  res.json(user);
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest & { validated?: import('./schemas.js').UpdateMeInput };
  const updated = await updateCurrentUser(authReq.user.id, authReq.validated!);
  res.json(updated);
}

export async function getMeFollowing(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const list = await listCurrentUserFollowing(authReq.user.id);
  res.json({ following: list });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest & { params: { id: string } };
  const viewerId = authReq.user?.id;
  const profile = await getPublicProfile(viewerId, authReq.params.id);
  res.json(profile);
}
