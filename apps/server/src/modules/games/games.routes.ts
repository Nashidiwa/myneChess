import { Router } from 'express';
import { gamesController } from './games.controller';
import { authenticate, optionalAuthenticate } from '../../middleware/auth';

const router = Router();

router.get('/history/me', authenticate, (req, res, next) =>
  gamesController.getMyHistory(req, res, next)
);

router.get('/:id', optionalAuthenticate, (req, res, next) =>
  gamesController.getGame(req, res, next)
);

router.get('/:id/moves', optionalAuthenticate, (req, res, next) =>
  gamesController.getMoves(req, res, next)
);

router.get('/:id/replay', optionalAuthenticate, (req, res, next) =>
  gamesController.getReplay(req, res, next)
);

router.post('/:id/move', optionalAuthenticate, (req, res, next) =>
  gamesController.makeMove(req, res, next)
);

router.post('/:id/timeout', optionalAuthenticate, (req, res, next) =>
  gamesController.claimTimeout(req, res, next)
);

router.post('/:id/claim-timeout', optionalAuthenticate, (req, res, next) =>
  gamesController.claimTimeout(req, res, next)
);

router.post('/:id/resign', optionalAuthenticate, (req, res, next) =>
  gamesController.resign(req, res, next)
);

router.post('/:id/draw-offer', authenticate, (req, res, next) =>
  gamesController.drawOffer(req, res, next)
);

router.post('/:id/draw-accept', authenticate, (req, res, next) =>
  gamesController.drawAccept(req, res, next)
);

export default router;
