import { Router, Request, Response, NextFunction } from 'express';
import { verificationPortalService } from '../services/verificationPortal.service';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Consultation publique des portails fonciers d Etat
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const portals = await verificationPortalService.getPublicPortals();
    res.status(200).json({
      success: true,
      data: portals,
    });
  } catch (error) {
    next(error);
  }
});

// Administration des liens et descriptifs des portails
router.post(
  '/',
  authenticate,
  authorize('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const portal = await verificationPortalService.createPortal(req.body);
      res.status(201).json({
        success: true,
        data: portal,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const updated = await verificationPortalService.updatePortal(
        id,
        req.body
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

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      await verificationPortalService.deletePortal(id);
      res.status(200).json({
        success: true,
        data: { message: 'Portail supprime avec succes.' },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
