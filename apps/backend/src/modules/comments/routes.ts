import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { createCommentSchema, updateCommentSchema } from './schemas.js';
import { list, create, update, remove, likeComment, unlikeComment } from './controller.js';

const router = Router({ mergeParams: true });
router.get('/', asyncHandler(list));
router.post('/', authMiddleware, validate(createCommentSchema), asyncHandler(create));
router.patch('/:commentId', authMiddleware, validate(updateCommentSchema), asyncHandler(update));
router.delete('/:commentId', authMiddleware, asyncHandler(remove));
router.post('/:commentId/like', authMiddleware, asyncHandler(likeComment));
router.delete('/:commentId/like', authMiddleware, asyncHandler(unlikeComment));
export default router;
