import { Router } from 'express';
import { listingController } from '../controllers/listing.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createListingSchema,
  updateListingSchema,
  queryListingsSchema,
} from '../schemas/listing.schema';

const router = Router();

// Recherche publique et cartographique d'annonces immobilieres
router.get('/', validate({ query: queryListingsSchema }), listingController.getListings);

// Annonces deposees par l'utilisateur connecte
router.get('/my/listings', authenticate, listingController.getMyListings);

// Consultation d'une annonce detaillee
router.get('/:id', listingController.getListingById);

// Creation d'une nouvelle annonce immobiliere ou fonciere
router.post(
  '/',
  authenticate,
  validate({ body: createListingSchema }),
  listingController.createListing
);

// Mise a jour d'une annonce (proprietaire ou admin)
router.patch(
  '/:id',
  authenticate,
  validate({ body: updateListingSchema }),
  listingController.updateListing
);

// Suppression / archivage d'une annonce
router.delete('/:id', authenticate, listingController.deleteListing);

export default router;
