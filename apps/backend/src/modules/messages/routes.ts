import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { createConversationSchema, sendMessageSchema } from './schemas.js';
import {
  listConversations,
  createConversation,
  listMessages,
  sendMessage,
  markAsRead,
} from './controller.js';

const router = Router();

router.get('/', authMiddleware, asyncHandler(listConversations));
router.post('/', authMiddleware, validate(createConversationSchema), asyncHandler(createConversation));
router.get('/:id/messages', authMiddleware, asyncHandler(listMessages));
router.post('/:id/messages', authMiddleware, validate(sendMessageSchema), asyncHandler(sendMessage));
router.post('/:id/read', authMiddleware, asyncHandler(markAsRead));

export default router;
