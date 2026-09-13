import { Router } from 'express';
import { searchAll } from '../controllers/search.controller.js';

const router = Router();

// GET /api/search?q=false+ceiling
router.get('/', searchAll);

export default router;
