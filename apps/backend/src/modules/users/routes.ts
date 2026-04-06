import { Router } from 'express';
import { authMiddleware, optionalAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { updateMeSchema } from './schemas.js';
import { getMe, updateMe, getMeFollowing, getById } from './controller.js';

const router = Router();
router.get('/me', authMiddleware, asyncHandler(getMe));
router.patch('/me', authMiddleware, validate(updateMeSchema), asyncHandler(updateMe));
router.get('/me/following', authMiddleware, asyncHandler(getMeFollowing));
router.get('/:id', optionalAuth, asyncHandler(getById));
export default router;
