import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { updatePostModerationSchema } from './schemas.js';
import { listPosts, updatePost, listUsersHandler } from './controller.js';

const router = Router();
router.use(authMiddleware);
router.use(requireAdmin);

router.get('/posts', asyncHandler(listPosts));
router.patch('/posts/:id', validate(updatePostModerationSchema), asyncHandler(updatePost));
router.get('/users', asyncHandler(listUsersHandler));

export default router;
