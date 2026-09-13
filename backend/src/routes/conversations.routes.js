import { Router } from 'express';
import multer from 'multer';
import {
  uploadConversation,
  getConversation,
  listConversations,
  confirmExtraction,
} from '../controllers/conversations.controller.js';

const upload = multer({ dest: process.env.UPLOAD_DIR || './uploads' });
const router = Router();

router.get('/', listConversations);
router.get('/:id', getConversation);
router.post('/upload', upload.single('file'), uploadConversation);
router.post('/:id/confirm', confirmExtraction);

export default router;
