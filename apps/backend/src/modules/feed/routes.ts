import { Router } from 'express';
import { optionalAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { listFeed } from './service.js';

async function feedHandler(req: import('express').Request, res: import('express').Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20));
  const sort = req.query.sort === 'following' ? 'following' : 'latest';
  const specialty = req.query.specialty ? String(req.query.specialty) : undefined;
  const currentUserId = (req as unknown as import('../../middleware/auth.js').AuthenticatedRequest).user?.id;
  const result = await listFeed({ page, limit, sort, specialty, currentUserId });
  res.json(result);
}

const router = Router();
router.get('/', optionalAuth, asyncHandler(feedHandler));
export default router;
