import { Router } from 'express';
import { listTasks, updateTask } from '../controllers/tasks.controller.js';

const router = Router();

router.get('/', listTasks);
router.patch('/:id', updateTask);

export default router;
