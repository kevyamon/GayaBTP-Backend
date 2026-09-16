import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { authRateLimiter } from '../middlewares/security.middleware';
import {
  adminLoginSchema,
  adminRegisterSchema,
  createAdminInviteSchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
  banUserSchema,
} from '../schemas/admin.schema';

const router = Router();

// ==========================================
// 1. ROUTES PUBLIQUES D'ACCÈS ADMIN (Rate Limitées)
// ==========================================

// Vérification de l'état d'initialisation du SuperAdmin (pour orienter le formulaire frontend)
router.get('/auth/setup-status', adminController.checkSetupStatus);

// Connexion dédiée au Backoffice Administrateur
router.post(
  '/auth/login',
  authRateLimiter,
  validate({ body: adminLoginSchema }),
  adminController.login
);

// Inscription Administrateur (SuperAdmin initial avec AD_PW ou Sous-Admin avec code temporaire)
router.post(
  '/auth/register',
  authRateLimiter,
  validate({ body: adminRegisterSchema }),
  adminController.register
);

// ==========================================
// 2. TOUTES LES ROUTES CI-DESSOUS NÉCESSITENT LE RÔLE ADMIN STRICT
// ==========================================
router.use(authenticate, authorize('admin'));

// Génération d'un code temporaire pour inviter un sous-administrateur
router.post(
  '/admins/invite',
  validate({ body: createAdminInviteSchema }),
  adminController.createInvitation
);

// Vue d'ensemble et statistiques KPIs temps réel
router.get('/dashboard', adminController.getDashboard);

// Gestion approfondie des utilisateurs
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetails);
router.patch(
  '/users/:id/status',
  validate({ body: updateUserStatusSchema }),
  adminController.updateUserStatus
);
router.patch(
  '/users/:id/role',
  validate({ body: updateUserRoleSchema }),
  adminController.updateUserRole
);
router.post(
  '/users/:id/ban',
  validate({ body: banUserSchema }),
  adminController.banUser
);

// Modération des annonces immobilières
router.get('/listings', adminController.getListings);
router.patch('/listings/:id/moderate', adminController.moderateListing);

// Validation et audit des paiements d'abonnements
router.get('/payments', adminController.getPayments);
router.post('/payments/:id/verify', adminController.verifyPayment);

// Audit des dossiers de certification (Badge Vérifié)
router.get('/verifications', adminController.getVerifications);
router.post('/verifications/:id/review', adminController.reviewVerification);

// Consultation du registre d'audit des actions administratives
router.get('/logs', adminController.getAuditLogs);

export default router;
