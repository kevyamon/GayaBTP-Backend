import { Router, Request, Response, NextFunction } from 'express';
import { faqService } from '../services/faq.service';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { FaqCategory } from '../models/faq.model';
import { getParam } from '../utils/params.util';

const router = Router();

// Consultation publique des questions frequentes (par categorie ou recherche)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = req.query.category as FaqCategory | undefined;
    const search = req.query.search as string | undefined;

    const faqs = await faqService.getPublishedFaqs(category, search);
    res.status(200).json({
      success: true,
      data: faqs,
    });
  } catch (error) {
    next(error);
  }
});

// Administration de la FAQ (reservee aux administrateurs)
router.post(
  '/',
  authenticate,
  authorize('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const faq = await faqService.createFaq(req.body);
      res.status(201).json({
        success: true,
        data: faq,
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
      const updated = await faqService.updateFaq(getParam(req.params.id), req.body);
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
      await faqService.deleteFaq(getParam(req.params.id));
      res.status(200).json({
        success: true,
        data: { message: 'Question/reponse supprimee avec succes.' },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
