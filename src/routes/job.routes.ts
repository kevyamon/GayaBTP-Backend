import { Router } from 'express';
import { jobController } from '../controllers/job.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createJobSchema,
  updateJobSchema,
  queryJobsSchema,
} from '../schemas/job.schema';

const router = Router();

// Consultation publique des opportunites (stages et emplois BTP)
router.get('/', validate({ query: queryJobsSchema }), jobController.getJobs);

// Offres publiees par le professionnel connecte
router.get(
  '/my/jobs',
  authenticate,
  authorize('professionnel', 'admin'),
  jobController.getMyJobs
);

// Consultation d'une offre specifique
router.get('/:id', jobController.getJobById);

// Publication d'une offre (exclusivement reservee aux professionnels et admins)
router.post(
  '/',
  authenticate,
  authorize('professionnel', 'admin'),
  validate({ body: createJobSchema }),
  jobController.createJob
);

// Modification d'une offre
router.patch(
  '/:id',
  authenticate,
  authorize('professionnel', 'admin'),
  validate({ body: updateJobSchema }),
  jobController.updateJob
);

// Suppression d'une offre
router.delete(
  '/:id',
  authenticate,
  authorize('professionnel', 'admin'),
  jobController.deleteJob
);

export default router;
