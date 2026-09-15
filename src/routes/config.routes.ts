import { Router } from 'express';
import { z } from 'zod';
import { configController } from '../controllers/config.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

const updateFreeModeSchema = z.object({
  isFreeModeEnabled: z.boolean({
    required_error: 'Le statut du mode gratuit est obligatoire.',
  }),
  freeModeBannerMessage: z
    .string()
    .max(300, 'Le message de bannière ne peut dépasser 300 caractères.')
    .optional(),
});

// Route publique : accessible sans token (pour le frontend)
router.get('/public', configController.getPublicConfig);

// Routes d'administration sécurisées
router.get(
  '/admin',
  authenticate,
  authorize('admin'),
  configController.getAdminSettings
);

router.patch(
  '/admin/free-mode',
  authenticate,
  authorize('admin'),
  validate({ body: updateFreeModeSchema }),
  configController.updateFreeMode
);

export default router;
