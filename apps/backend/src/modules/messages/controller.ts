import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import {
  listConversations as listConversationsService,
  getOrCreateConversation,
  listMessages as listMessagesService,
  sendMessage as sendMessageService,
  markAsRead as markAsReadService,
} from './service.js';
import type { CreateConversationInput, SendMessageInput } from './schemas.js';

export async function listConversations(req: Request, res: Response): Promise<void> {
  const { user } = req as AuthenticatedRequest;
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20));
  const result = await listConversationsService(user.id, page, limit);
  res.json({ ...result, page, limit });
}

export async function createConversation(req: Request, res: Response): Promise<void> {
  const { user } = req as AuthenticatedRequest;
  const { recipientId } = (req as Request & { validated: CreateConversationInput }).validated;
  const conversation = await getOrCreateConversation(user.id, recipientId);
  res.json(conversation);
}

export async function listMessages(req: Request, res: Response): Promise<void> {
  const { user } = req as AuthenticatedRequest;
  const conversationId = String(req.params.id);
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20));
  const result = await listMessagesService(conversationId, user.id, page, limit);
  res.json({ ...result, page, limit });
}

export async function sendMessage(req: Request, res: Response): Promise<void> {
  const { user } = req as AuthenticatedRequest;
  const conversationId = String(req.params.id);
  const payload = (req as Request & { validated: SendMessageInput }).validated;
  const message = await sendMessageService(conversationId, user.id, payload);
  res.status(201).json(message);
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
  const { user } = req as AuthenticatedRequest;
  const conversationId = String(req.params.id);
  await markAsReadService(conversationId, user.id);
  res.status(204).send();
}
