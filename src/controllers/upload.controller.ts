import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { cloudinaryService } from '../services/cloudinary.service';
import { AppError } from '../utils/appError';

// Configuration du stockage mémoire pour Multer
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 Mo max
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(AppError.badRequest('Seuls les fichiers images sont acceptés.'));
    }
  },
});

class UploadController {
  async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file && !req.body.image) {
        throw AppError.badRequest('Aucun fichier image fourni.');
      }

      const folder = (req.body.folder as string) || 'gayabtp/profiles';

      let uploadResult: { url: string; publicId?: string };

      if (req.file) {
        uploadResult = await cloudinaryService.uploadBuffer(
          req.file.buffer,
          folder,
          req.file.mimetype
        );
      } else {
        uploadResult = await cloudinaryService.uploadBase64(req.body.image, folder);
      }

      res.status(200).json({
        success: true,
        data: uploadResult,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const uploadController = new UploadController();
