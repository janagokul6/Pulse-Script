import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { registerDeviceSchema } from './schemas.js';
import { list, readAll, readOne, registerDevice } from './controller.js';

const router = Router();
router.get('/', authMiddleware, asyncHandler(list));
router.patch('/read-all', authMiddleware, asyncHandler(readAll));
router.patch('/:id/read', authMiddleware, asyncHandler(readOne));
router.post('/register-device', authMiddleware, validate(registerDeviceSchema), asyncHandler(registerDevice));
export default router;
