import { Router } from 'express';
import authRoutes from './auth.routes';
import proRoutes from './pro.routes';
import listingRoutes from './listing.routes';
import alertRoutes from './alert.routes';
import jobRoutes from './job.routes';
import schoolRoutes from './school.routes';
import blogRoutes from './blog.routes';
import faqRoutes from './faq.routes';
import notificationRoutes from './notification.routes';
import verificationPortalRoutes from './verificationPortal.routes';
import calculatorRoutes from './calculator.routes';
import paymentRoutes from './payment.routes';
import adminRoutes from './admin.routes';

const apiRouter = Router();

// 1. Module Authentification
apiRouter.use('/auth', authRoutes);

// 2. Module Professionnels & Annuaire BTP
apiRouter.use('/pros', proRoutes);

// 3. Module Immobilier & Terrains
apiRouter.use('/listings', listingRoutes);

// 4. Module Alertes Budgétaires
apiRouter.use('/alerts', alertRoutes);

// 5. Module Emplois & Stages BTP
apiRouter.use('/jobs', jobRoutes);

// 6. Module Écoles & Lycées Techniques
apiRouter.use('/schools', schoolRoutes);

// 7. Module Blog & Guides Fonciers
apiRouter.use('/blog', blogRoutes);

// 8. Module FAQ Administrable
apiRouter.use('/faqs', faqRoutes);

// 9. Module Centre de Notifications
apiRouter.use('/notifications', notificationRoutes);

// 10. Module Hub Portails Fonciers Officiels
apiRouter.use('/verification-portals', verificationPortalRoutes);

// 11. Module Calculateur de Budget Transactionnel
apiRouter.use('/calculator', calculatorRoutes);

// 12. Module Règlements & Souscriptions
apiRouter.use('/payments', paymentRoutes);

// 13. Module Dashboard Administrateur
apiRouter.use('/admin', adminRoutes);

// Informations de statut de l'API v1
apiRouter.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      api: 'GayaBTP REST API',
      version: 'v1',
      status: 'operational',
      endpoints: {
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        pros: '/api/v1/pros',
        listings: '/api/v1/listings',
        alerts: '/api/v1/alerts',
        jobs: '/api/v1/jobs',
        schools: '/api/v1/schools',
        blog: '/api/v1/blog',
        faqs: '/api/v1/faqs',
        verificationPortals: '/api/v1/verification-portals',
        notifications: '/api/v1/notifications',
        admin: '/api/v1/admin',
      },
    },
  });
});

export default apiRouter;
