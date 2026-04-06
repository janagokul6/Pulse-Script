import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { follow, unfollow, list } from './controller.js';

const router = Router({ mergeParams: true });
router.post('/', authMiddleware, asyncHandler(follow));
router.delete('/', authMiddleware, asyncHandler(unfollow));
router.get('/', authMiddleware, asyncHandler(list));
export default router;
