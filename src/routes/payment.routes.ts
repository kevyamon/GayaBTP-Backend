import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Toutes les routes necessitent une authentification
router.use(authenticate);

// Soumission d'une preuve de paiement pour souscription
router.post('/', authorize('professionnel'), paymentController.submitPayment);

// Historique des paiements de l'utilisateur
router.get('/my', paymentController.getMyPayments);

// Soumission d'un dossier de certification GayaBTP
router.post('/verification', authorize('professionnel'), paymentController.submitVerification);

// Statut de sa propre demande de certification
router.get('/verification/my', authorize('professionnel'), paymentController.getMyVerification);

export default router;
