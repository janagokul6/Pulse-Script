import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { listCommentsForPost, createComment, updateComment, deleteComment, toggleCommentLike } from './service.js';

function getPostId(req: Request): string {
  const p = req.params as { postId?: string; id?: string };
  return p.postId ?? p.id ?? '';
}

export async function list(req: Request, res: Response): Promise<void> {
  const postId = getPostId(req);
  const result = await listCommentsForPost(postId);
  res.json({ comments: result });
}

export async function create(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest & { validated: { body: string; parentId?: string } };
  const postId = getPostId(req);
  const comment = await createComment({
    postId,
    userId: authReq.user.id,
    userName: authReq.user.name,
    body: authReq.validated.body,
    parentId: authReq.validated.parentId,
  });
  res.status(201).json(comment);
}

export async function update(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest & { params: { commentId: string }; validated: { body: string } };
  const comment = await updateComment(authReq.params.commentId, authReq.user.id, authReq.validated.body);
  res.json(comment);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest & { params: { commentId: string } };
  await deleteComment(authReq.params.commentId, authReq.user.id);
  res.status(204).send();
}

export async function likeComment(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest & { params: { commentId: string } };
  const result = await toggleCommentLike(authReq.params.commentId, authReq.user.id);
  res.json(result);
}

export async function unlikeComment(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest & { params: { commentId: string } };
  const result = await toggleCommentLike(authReq.params.commentId, authReq.user.id);
  res.json(result);
}
