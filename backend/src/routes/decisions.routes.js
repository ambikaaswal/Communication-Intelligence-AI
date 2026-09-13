import { Router } from 'express';
import { listDecisions, updateDecision } from '../controllers/decisions.controller.js';

const router = Router();

router.get('/', listDecisions);
router.patch('/:id', updateDecision);

export default router;
