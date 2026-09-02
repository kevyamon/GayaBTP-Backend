import { Router, Request, Response, NextFunction } from 'express';
import { calculatorService } from '../services/calculator.service';
import { z } from 'zod';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

const calculatorSchema = z.object({
  priceFCFA: z
    .number({ message: 'Le montant du bien est obligatoire' })
    .min(0, 'Le montant ne peut pas etre negatif'),
  includeACDInstruction: z.boolean().optional(),
  includeSurveyBornage: z.boolean().optional(),
});

// Estimation en temps reel du budget transactionnel global
router.post(
  '/estimate',
  validate({ body: calculatorSchema }),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const estimation = calculatorService.calculateTransactionBudget(req.body);
      res.status(200).json({
        success: true,
        data: estimation,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
