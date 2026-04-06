import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { searchPosts } from './service.js';

async function search(req: import('express').Request, res: import('express').Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20));
  const q = String(req.query.q ?? req.query.search ?? '').trim();
  const specialty = req.query.specialty ? String(req.query.specialty) : undefined;
  const result = await searchPosts({ q, specialty, page, limit });
  res.json(result);
}

const router = Router();
router.get('/', asyncHandler(search));
export default router;
