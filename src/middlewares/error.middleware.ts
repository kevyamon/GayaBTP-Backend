import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodIssue } from 'zod';
import mongoose from 'mongoose';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

interface ErrorResponsePayload {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export const errorHandler = (
  err: Error | AppError | unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  void _next; // Conservation des 4 arguments necessaires a Express pour identifier le middleware d'erreur

  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'Une erreur inattendue est survenue sur le serveur.';
  let details: unknown = undefined;

  // Cas 1: Erreur operationnelle controlee (AppError)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  }
  // Cas 2: Erreur de validation Zod
  else if (err instanceof ZodError) {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = 'Les donnees transmises ne respectent pas le format attendu.';
    details = err.issues.map((issue: ZodIssue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  }
  // Cas 3: Erreur Cast MongoDB (ex: ObjectId invalide)
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    code = 'BAD_REQUEST';
    message = `Identifiant invalide : ${err.value}`;
  }
  // Cas 4: Erreur de cle dupliquee MongoDB (index unique viole)
  else if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: number }).code === 11000
  ) {
    statusCode = 409;
    code = 'CONFLICT';
    const keyVal = (err as { keyValue?: Record<string, unknown> }).keyValue;
    const fieldName = keyVal ? Object.keys(keyVal)[0] : 'champ';
    message = `Une ressource avec cette valeur (${fieldName}) existe deja.`;
  }
  // Cas 5: Erreur d'authentification JWT
  else if (err instanceof Error && err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Jeton d acces invalide ou altere.';
  } else if (err instanceof Error && err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Votre session a expire. Veuillez renouveler votre jeton.';
  }
  // Cas 6: Erreur inconnue non controlee
  else {
    logger.error('SYSTEM', `Erreur non interceptee sur ${req.method} ${req.originalUrl}`, err, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  const responsePayload: ErrorResponsePayload = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };

  res.status(statusCode).json(responsePayload);
};
