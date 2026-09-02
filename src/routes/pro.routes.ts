import { Router } from 'express';
import { proController } from '../controllers/pro.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  updateProProfileSchema,
  addServiceSchema,
  addProjectSchema,
  queryProsSchema,
} from '../schemas/pro.schema';

const router = Router();

// Annuaire public des professionnels (recherche filtree et paginee)
router.get('/', validate({ query: queryProsSchema }), proController.getPros);

// Consultation de son propre profil professionnel et de ses quotas actifs
router.get('/me', authenticate, authorize('professionnel'), proController.getMyProProfile);

// Mise a jour de sa fiche professionnelle
router.patch(
  '/me',
  authenticate,
  authorize('professionnel'),
  validate({ body: updateProProfileSchema }),
  proController.updateMyProfile
);

// Gestion des prestations / services
router.post(
  '/me/services',
  authenticate,
  authorize('professionnel'),
  validate({ body: addServiceSchema }),
  proController.addService
);
router.delete(
  '/me/services/:id',
  authenticate,
  authorize('professionnel'),
  proController.deleteService
);

// Gestion du portfolio / realisations de projets
router.post(
  '/me/projects',
  authenticate,
  authorize('professionnel'),
  validate({ body: addProjectSchema }),
  proController.addProject
);
router.delete(
  '/me/projects/:id',
  authenticate,
  authorize('professionnel'),
  proController.deleteProject
);

// Consultation publique d'une fiche professionnelle par son ID
router.get('/:id', proController.getProById);

export default router;
