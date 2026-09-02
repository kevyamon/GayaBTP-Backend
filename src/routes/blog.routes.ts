import { Router } from 'express';
import { blogController } from '../controllers/blog.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Consultation publique des articles de blog (paginee et filtree)
router.get('/', blogController.getArticles);

// Articles similaires d'une categorie
router.get('/similar/:slug', blogController.getSimilarArticles);

// Consultation d'un article par son slug SEO
router.get('/:slug', blogController.getArticleBySlug);

// Administration du blog (reservee aux administrateurs)
router.post('/', authenticate, authorize('admin'), blogController.createArticle);
router.patch('/:id', authenticate, authorize('admin'), blogController.updateArticle);
router.delete('/:id', authenticate, authorize('admin'), blogController.deleteArticle);

export default router;
