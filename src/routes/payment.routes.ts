import { Router } from 'express';
import { z } from 'zod';
import { paymentController } from '../controllers/payment.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

const initiatePaymentSchema = z.object({
  planSlug: z.enum(['starter', 'pro', 'premium'], {
    required_error: 'La formule d abonnement est obligatoire.',
  }),
  paymentMethod: z
    .enum(['wave', 'mtn_momo', 'orange_money', 'moov_money', 'virement'])
    .default('wave'),
});

// 1. Webhook public Genius Pay (authentification par signature cryptographique HMAC)
router.post('/webhook/geniuspay', paymentController.handleGeniusPayWebhook);

// 2. Routes protégées nécessitant une session utilisateur active
router.use(authenticate);

// Initialisation d'une session de paiement Genius Pay (Wave, MoMo, Orange, CB)
router.post(
  '/initiate',
  authorize('professionnel'),
  validate({ body: initiatePaymentSchema }),
  paymentController.initiatePayment
);

// Soumission manuelle d'une preuve de virement
router.post('/', authorize('professionnel'), paymentController.submitPayment);

// Historique des règlements de l'utilisateur connecté
router.get('/my', paymentController.getMyPayments);

// Dépôt et consultation de dossier de certification GayaBTP
router.post('/verification', authorize('professionnel'), paymentController.submitVerification);
router.get('/verification/my', authorize('professionnel'), paymentController.getMyVerification);

export default router;
