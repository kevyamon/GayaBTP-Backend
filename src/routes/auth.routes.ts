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
  googleAuthSchema,
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

// Connexion Google OAuth 2.0 (Google Identity Services)
router.post(
  '/google',
  authRateLimiter,
  validate({ body: googleAuthSchema }),
  authController.googleAuth
);

// Renouvellement de session via Refresh Token
router.post('/refresh', authController.refresh);

// Déconnexion (nettoyage du cookie HttpOnly)
router.post('/logout', authController.logout);

// Profil de l'utilisateur connecté
router.get('/me', authenticate, authController.getMe);
router.patch('/me', authenticate, authController.updateMe);

// Demande de code OTP pour mot de passe oublié
router.post(
  '/forgot-password',
  passwordResetRateLimiter,
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword
);

// Réinitialisation du mot de passe avec code OTP
router.post(
  '/reset-password',
  passwordResetRateLimiter,
  validate({ body: resetPasswordSchema }),
  authController.resetPassword
);

export default router;
