import { Router } from 'express';
import { userPublicController } from '../controllers/userPublic.controller';

const router = Router();

// Route publique pour consulter le profil d'un utilisateur et ses annonces
router.get('/:id/public-profile', userPublicController.getPublicProfile);
router.get('/public/:id', userPublicController.getPublicProfile);

export default router;
