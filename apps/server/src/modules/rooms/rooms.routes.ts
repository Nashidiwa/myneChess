import { Router } from 'express';
import { roomsController } from './rooms.controller';
import { authenticate, optionalAuthenticate } from '../../middleware/auth';

const router = Router();

router.get('/', (req, res, next) => roomsController.getRooms(req, res, next));
router.post('/', authenticate, (req, res, next) => roomsController.createRoom(req, res, next));
router.get('/:id', optionalAuthenticate, (req, res, next) => roomsController.getRoom(req, res, next));
router.post('/:id/join', authenticate, (req, res, next) => roomsController.joinRoom(req, res, next));
router.post('/:id/leave', authenticate, (req, res, next) => roomsController.leaveRoom(req, res, next));

export default router;
