import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { CookieOptions } from 'express';
import { env } from '../config/env.config';
import { UserRole } from '../models/user.model';
import { AppError } from './appError';

export interface AccessTokenPayload {
  userId: string;
  role: UserRole;
  email: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}

export const REFRESH_COOKIE_NAME = 'gayabtp_refresh_token';

// Options securisees pour le cookie HttpOnly du Refresh Token
export const getRefreshCookieOptions = (): CookieOptions => {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
    path: '/api/v1/auth', // Limite le cookie uniquement aux routes d'authentification
  };
};

export const generateAccessToken = (payload: AccessTokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as unknown as number,
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET as Secret, options);
};

export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as unknown as number,
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET as Secret, options);
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET as Secret) as AccessTokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized('Le jeton d acces a expire');
    }
    throw AppError.unauthorized('Jeton d acces invalide');
  }
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET as Secret) as RefreshTokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized('La session a expire. Veuillez vous reconnecter.');
    }
    throw AppError.unauthorized('Jeton de rafraichissement invalide');
  }
};
