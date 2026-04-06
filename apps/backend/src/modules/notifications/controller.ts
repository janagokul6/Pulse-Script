import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import {
  listNotifications,
  markAllAsRead,
  markAsRead,
  registerDevice as registerDeviceService,
} from './service.js';

export async function list(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20));
  const unreadOnly = req.query.unread === 'true';
  const result = await listNotifications({
    userId: authReq.user.id,
    page,
    limit,
    unreadOnly,
  });
  res.json(result);
}

export async function readAll(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  await markAllAsRead(authReq.user.id);
  res.status(204).send();
}

export async function readOne(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest & { params: { id: string } };
  await markAsRead(authReq.user.id, authReq.params.id);
  res.status(204).send();
}

export async function registerDevice(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest & { validated: { token: string } };
  await registerDeviceService(authReq.user.id, authReq.validated.token);
  res.status(204).send();
}
