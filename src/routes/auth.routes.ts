import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authRateLimiter } from '../middlewares/security.middleware';
import {
  registerParticulierSchema,
  registerProSchema,
  loginSchema,
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

export default router;
