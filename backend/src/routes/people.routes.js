import { Router } from 'express';
import { listPeople } from '../controllers/people.controller.js';

const router = Router();

router.get('/', listPeople);

export default router;
