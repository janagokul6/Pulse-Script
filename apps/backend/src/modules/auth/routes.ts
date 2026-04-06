import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();
router.get('/me', authMiddleware, (req, res) => {
  res.json((req as unknown as import('../../middleware/auth.js').AuthenticatedRequest).user);
});
export default router;
