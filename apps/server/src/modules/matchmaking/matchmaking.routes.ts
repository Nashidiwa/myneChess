import { Router } from 'express';
import { matchmakingService } from './matchmaking.service';
import { authenticate } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

const router = Router();

router.post('/status', authenticate, (req, res) => {
  if (!req.user) throw new AppError(401, 'Chưa đăng nhập');
  const status = matchmakingService.getQueueStatus(req.user.userId);
  res.status(200).json({ success: true, data: status });
});

router.post('/cancel', authenticate, (req, res) => {
  if (!req.user) throw new AppError(401, 'Chưa đăng nhập');
  const cancelled = matchmakingService.removeFromQueue(req.user.userId);
  res.status(200).json({ success: true, data: { cancelled } });
});

export default router;
