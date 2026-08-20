import { Router } from 'express';
import { listMovements, createMovement } from '../controllers/movementsController.js';

const router = Router();

router.get('/', listMovements);
router.post('/', createMovement);

export default router;