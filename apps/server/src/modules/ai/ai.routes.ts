import { Router } from 'express';
import { aiController } from './ai.controller';
import { optionalAuthenticate } from '../../middleware/auth';

const router = Router();

router.post('/game', optionalAuthenticate, (req, res, next) =>
  aiController.createAIGame(req, res, next)
);

router.post('/move', optionalAuthenticate, (req, res, next) =>
  aiController.triggerAIMove(req, res, next)
);

export default router;
