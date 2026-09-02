import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors, { CorsOptions } from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.config';
import { AppError } from '../utils/appError';

// 1. Headers HTTP securises
export const helmetMiddleware = helmet({
  contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
});

// 2. Configuration CORS stricte
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Autoriser les outils sans origine (ex: curl/postman/mobile) en developpement
    if (!origin && env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    if (origin && env.ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    callback(AppError.forbidden('Origine CORS non autorisee par la politique de securite'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

export const corsMiddleware = cors(corsOptions);

// 3. Limiteur de requetes general (Protection DoS)
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requetes par fenetre
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response, next: NextFunction) => {
    next(
      new AppError(
        'Trop de requetes envoyees depuis cette adresse IP. Veuillez patienter 15 minutes.',
        429,
        'RATE_LIMIT_EXCEEDED'
      )
    );
  },
});

// 4. Limiteur de requetes sensible (Authentification / Inscription)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 tentatives max pour eviter le brute-force
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response, next: NextFunction) => {
    next(
      new AppError(
        'Trop de tentatives d authentification. Acces temporairement restreint pour securite.',
        429,
        'RATE_LIMIT_EXCEEDED'
      )
    );
  },
});

// 5. Nettoyage anti-injection NoSQL ($ et .)
const sanitizeValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    const cleanObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (!k.startsWith('$') && !k.includes('.')) {
        cleanObj[k] = sanitizeValue(v);
      }
    }
    return cleanObj;
  }
  return value;
};

export const sanitizeInputs = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query) as typeof req.query;
  if (req.params) req.params = sanitizeValue(req.params) as typeof req.params;
  next();
};
