import { Router } from 'express';
import multer from 'multer';
import { authMiddleware, optionalAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { createPostSchema, updatePostSchema, aiStructureSchema } from './schemas.js';
import commentsRouter from '../comments/routes.js';
import {
  transcribe,
  aiStructure,
  create,
  list,
  getById,
  update,
  remove,
  addBookmarkRoute,
  removeBookmarkRoute,
} from './controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.use('/:postId/comments', commentsRouter);

router.post('/transcribe', authMiddleware, upload.single('audio'), asyncHandler(transcribe));
router.post('/ai-structure', authMiddleware, validate(aiStructureSchema), asyncHandler(aiStructure));
router.post('/', authMiddleware, validate(createPostSchema), asyncHandler(create));
router.get('/', asyncHandler(list));
router.get('/:id', optionalAuth, asyncHandler(getById));
router.patch('/:id', authMiddleware, validate(updatePostSchema), asyncHandler(update));
router.delete('/:id', authMiddleware, asyncHandler(remove));
router.post('/:id/bookmark', authMiddleware, asyncHandler(addBookmarkRoute));
router.delete('/:id/bookmark', authMiddleware, asyncHandler(removeBookmarkRoute));

export default router;
