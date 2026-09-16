import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import {
  authRateLimiter,
  passwordResetRateLimiter,
} from '../middlewares/security.middleware';
import {
  registerParticulierSchema,
  registerProSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schemas/auth.schema';

const router = Router();

// Inscription Particulier
router.post(
  '/register/particulier',
  authRateLimiter,
  validate({ body: registerParticulierSchema }),
  authController.registerParticulier
);

// Inscription Professionnel (BTP, Cabinet, Artisan, etc.)
router.post(
  '/register/pro',
  authRateLimiter,
  validate({ body: registerProSchema }),
  authController.registerProfessionnel
);

// Connexion standard
router.post(
  '/login',
  authRateLimiter,
  validate({ body: loginSchema }),
  authController.login
);

// Renouvellement de session via Refresh Token
router.post('/refresh', authController.refresh);

// Deconnexion (nettoyage du cookie HttpOnly)
router.post('/logout', authController.logout);

// Profil de l'utilisateur connecte
router.get('/me', authenticate, authController.getMe);

// Demande de code OTP pour mot de passe oublie
router.post(
  '/forgot-password',
  passwordResetRateLimiter,
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword
);

// Reinitialisation du mot de passe avec code OTP
router.post(
  '/reset-password',
  passwordResetRateLimiter,
  validate({ body: resetPasswordSchema }),
  authController.resetPassword
);

export default router;
