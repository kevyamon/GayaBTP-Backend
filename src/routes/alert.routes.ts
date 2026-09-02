import { Router } from 'express';
import { alertController } from '../controllers/alert.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createAlertSchema,
  updateAlertSchema,
  queryAlertsSchema,
} from '../schemas/alert.schema';

const router = Router();

// Toutes les routes d'alertes necessitent une authentification
router.use(authenticate);

// Liste des alertes de l'utilisateur
router.get('/', validate({ query: queryAlertsSchema }), alertController.getUserAlerts);

// Creation d'une alerte
router.post(
  '/',
  validate({ body: createAlertSchema }),
  alertController.createAlert
);

// Consultation d'une alerte specifique
router.get('/:id', alertController.getAlertById);

// Modification d'une alerte
router.patch(
  '/:id',
  validate({ body: updateAlertSchema }),
  alertController.updateAlert
);

// Activation / desactivation d'une alerte
router.patch('/:id/toggle', alertController.toggleAlert);

// Suppression definitive d'une alerte
router.delete('/:id', alertController.deleteAlert);

export default router;
