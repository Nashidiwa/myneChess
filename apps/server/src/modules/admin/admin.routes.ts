import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

// Enforce authentication & ADMIN role for all administrative routes
router.use(authenticate, requireRole('ADMIN'));

router.get('/users', (req, res, next) => adminController.getUsers(req, res, next));
router.patch('/users/:id/status', (req, res, next) =>
  adminController.updateUserStatus(req, res, next)
);
router.get('/stats', (req, res, next) => adminController.getSystemStats(req, res, next));

export default router;
