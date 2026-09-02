import express, { Application, Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import {
  helmetMiddleware,
  corsMiddleware,
  globalRateLimiter,
  sanitizeInputs,
} from './middlewares/security.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { AppError } from './utils/appError';
import { env } from './config/env.config';

import apiRouter from './routes';

const app: Application = express();

// 1. En-tetes de securite et CORS
app.use(helmetMiddleware);
app.use(corsMiddleware);

// 2. Journalisation HTTP
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// 3. Limiteur global de requetes et parsing securise
app.use(globalRateLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 4. Nettoyage anti-injection NoSQL
app.use(sanitizeInputs);

// 5. Verification de sante de l'API (Healthcheck)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      service: 'GayaBTP API',
      version: 'v1',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
  });
});

// 6. Routes de l'API v1
app.use('/api/v1', apiRouter);

// 7. Gestion des routes inexistantes (404)
app.use('*', (req: Request, _res: Response, next: NextFunction) => {
  next(AppError.notFound(`La ressource ${req.method} ${req.originalUrl} n existe pas sur ce serveur`));
});

// 7. Gestionnaire centralise d'erreurs
app.use(errorHandler);

export default app;
