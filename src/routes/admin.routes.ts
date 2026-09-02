import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Toutes les routes administratives necessitent une authentification avec role ADMIN
router.use(authenticate, authorize('admin'));

// Vue d'ensemble et statistiques KPIs temps reel
router.get('/dashboard', adminController.getDashboard);

// Gestion des utilisateurs
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.patch('/users/:id/role', adminController.updateUserRole);

// Modération des annonces immobilieres
router.get('/listings', adminController.getListings);
router.patch('/listings/:id/moderate', adminController.moderateListing);

// Validation et audit des paiements d'abonnements
router.get('/payments', adminController.getPayments);
router.post('/payments/:id/verify', adminController.verifyPayment);

// Audit des dossiers de certification (Badge Verifie)
router.get('/verifications', adminController.getVerifications);
router.post('/verifications/:id/review', adminController.reviewVerification);

// Consultation du registre d'audit des actions administratives
router.get('/logs', adminController.getAuditLogs);

export default router;
