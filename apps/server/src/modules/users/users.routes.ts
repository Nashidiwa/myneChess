import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { updateProfileSchema } from '@online-chess/shared';

const router = Router();

router.get('/me', authenticate, (req, res, next) => usersController.getMe(req, res, next));
router.patch('/me', authenticate, validate(updateProfileSchema), (req, res, next) =>
  usersController.updateMe(req, res, next)
);
router.get('/:id/stats', (req, res, next) => usersController.getUserStats(req, res, next));

export default router;
