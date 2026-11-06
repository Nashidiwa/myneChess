import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from '@online-chess/shared';

const router = Router();

router.post('/register', validate(registerSchema), (req, res, next) =>
  authController.register(req, res, next)
);

router.post('/login', validate(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

router.post('/google', validate(googleAuthSchema), (req, res, next) =>
  authController.googleAuth(req, res, next)
);

router.post('/verify-email', validate(verifyEmailSchema), (req, res, next) =>
  authController.verifyEmail(req, res, next)
);

router.post('/resend-verification', validate(resendVerificationSchema), (req, res, next) =>
  authController.resendVerification(req, res, next)
);

router.post('/logout', (req, res) => authController.logout(req, res));

router.get('/me', authenticate, (req, res, next) =>
  authController.getMe(req, res, next)
);

export default router;
