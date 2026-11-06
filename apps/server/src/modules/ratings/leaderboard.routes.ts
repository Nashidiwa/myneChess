import { Router } from 'express';
import { leaderboardController } from './leaderboard.controller';

const router = Router();

router.get('/', (req, res, next) => leaderboardController.getLeaderboard(req, res, next));

export default router;
