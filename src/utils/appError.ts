export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'PLAN_LIMIT_REACHED'
  | 'PAYMENT_REQUIRED'
  | 'RESOURCE_EXPIRED'
  | 'INTERNAL_SERVER_ERROR'
  | 'DATABASE_ERROR';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCode = 'INTERNAL_SERVER_ERROR',
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, code: ErrorCode = 'BAD_REQUEST', details?: unknown): AppError {
    return new AppError(message, 400, code, details);
  }

  static unauthorized(message: string = 'Acces non autorise', details?: unknown): AppError {
    return new AppError(message, 401, 'UNAUTHORIZED', details);
  }

  static forbidden(message: string = 'Acces interdit pour ce role ou cette ressource', details?: unknown): AppError {
    return new AppError(message, 403, 'FORBIDDEN', details);
  }

  static notFound(message: string = 'Ressource introuvable', details?: unknown): AppError {
    return new AppError(message, 404, 'NOT_FOUND', details);
  }

  static conflict(message: string, details?: unknown): AppError {
    return new AppError(message, 409, 'CONFLICT', details);
  }

  static validation(message: string = 'Donnees invalides', details?: unknown): AppError {
    return new AppError(message, 422, 'VALIDATION_ERROR', details);
  }

  static planLimitReached(message: string = 'La limite de votre abonnement a ete atteinte'): AppError {
    return new AppError(message, 403, 'PLAN_LIMIT_REACHED');
  }

  static internal(message: string = 'Une erreur interne est survenue'): AppError {
    return new AppError(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}
