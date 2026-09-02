import { Router } from 'express';
import { schoolController } from '../controllers/school.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Consultation publique de l'annuaire des etablissements techniques
router.get('/', schoolController.getSchools);

// Consultation d'un etablissement par ID
router.get('/:id', schoolController.getSchoolById);

// Gestion administrative (reservee aux administrateurs)
router.post('/', authenticate, authorize('admin'), schoolController.createSchool);
router.patch('/:id', authenticate, authorize('admin'), schoolController.updateSchool);
router.delete('/:id', authenticate, authorize('admin'), schoolController.deleteSchool);

export default router;
