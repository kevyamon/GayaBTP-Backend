import { Router, Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { authenticate } from '../middlewares/auth.middleware';
import { AppError } from '../utils/appError';

const router = Router();

// Toutes les routes de notifications sont securisees
router.use(authenticate);

// Liste des notifications de l'utilisateur avec compteur des non-lues
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw AppError.unauthorized();
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    const result = await notificationService.getUserNotifications(
      req.user.userId,
      page,
      limit
    );

    res.status(200).json({
      success: true,
      data: result.notifications,
      unreadCount: result.unreadCount,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

// Marquer une notification comme lue
router.patch(
  '/:id/read',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw AppError.unauthorized();
      const updated = await notificationService.markAsRead(
        req.params.id,
        req.user.userId
      );

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Marquer toutes les notifications comme lues
router.patch(
  '/read-all',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw AppError.unauthorized();
      await notificationService.markAllAsRead(req.user.userId);

      res.status(200).json({
        success: true,
        data: { message: 'Toutes les notifications ont ete marquees comme lues.' },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
