import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { list, add, remove } from './controller.js';

const router = Router({ mergeParams: true });
router.get('/', authMiddleware, asyncHandler(list));
router.post('/:postId', authMiddleware, asyncHandler(add));
router.delete('/:postId', authMiddleware, asyncHandler(remove));
export default router;
