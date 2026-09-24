import { Router } from 'express';
import { uploadController, uploadMiddleware } from '../controllers/upload.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Route d'upload d'image vers Cloudinary (accessible aux utilisateurs connectés)
router.post(
  '/image',
  authenticate,
  uploadMiddleware.single('file'),
  uploadController.uploadImage
);

export default router;
