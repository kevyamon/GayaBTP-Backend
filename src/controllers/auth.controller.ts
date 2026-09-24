import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { passwordResetService } from '../services/passwordReset.service';
import {
  REFRESH_COOKIE_NAME,
  getRefreshCookieOptions,
} from '../utils/token.util';
import { AppError } from '../utils/appError';

class AuthController {
  async registerParticulier(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await authService.registerParticulier(req.body);

      res.cookie(
        REFRESH_COOKIE_NAME,
        result.tokens.refreshToken,
        getRefreshCookieOptions()
      );

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
          tokens: {
            accessToken: result.tokens.accessToken,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async registerProfessionnel(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await authService.registerProfessionnel(req.body);

      res.cookie(
        REFRESH_COOKIE_NAME,
        result.tokens.refreshToken,
        getRefreshCookieOptions()
      );

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          proProfile: result.proProfile,
          accessToken: result.tokens.accessToken,
          tokens: {
            accessToken: result.tokens.accessToken,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);

      res.cookie(
        REFRESH_COOKIE_NAME,
        result.tokens.refreshToken,
        getRefreshCookieOptions()
      );

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          proProfile: result.proProfile,
          accessToken: result.tokens.accessToken,
          tokens: {
            accessToken: result.tokens.accessToken,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idToken } = req.body;
      const result = await authService.loginWithGoogle(idToken);

      res.cookie(
        REFRESH_COOKIE_NAME,
        result.tokens.refreshToken,
        getRefreshCookieOptions()
      );

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          proProfile: result.proProfile,
          accessToken: result.tokens.accessToken,
          tokens: {
            accessToken: result.tokens.accessToken,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token =
        req.cookies[REFRESH_COOKIE_NAME] || req.body.refreshToken;

      if (!token) {
        throw AppError.unauthorized(
          'Jeton de rafraîchissement absent. Veuillez vous reconnecter.'
        );
      }

      const newTokens = await authService.refreshTokens(token);

      res.cookie(
        REFRESH_COOKIE_NAME,
        newTokens.refreshToken,
        getRefreshCookieOptions()
      );

      res.status(200).json({
        success: true,
        data: {
          accessToken: newTokens.accessToken,
          tokens: {
            accessToken: newTokens.accessToken,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie(REFRESH_COOKIE_NAME, {
        path: '/',
      });

      res.status(200).json({
        success: true,
        data: {
          message: 'Déconnexion effectuée avec succès.',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Utilisateur non authentifié.');
      }

      const me = await authService.getMe(req.user.userId);

      res.status(200).json({
        success: true,
        data: me,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Utilisateur non authentifié.');
      }

      const result = await authService.updateMe(req.user.userId, req.body);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.body;
      await passwordResetService.requestResetOtp(email);

      res.status(200).json({
        success: true,
        message:
          'Si cette adresse est enregistrée, un e-mail avec le code de sécurité vient d’être envoyé.',
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, otp, newPassword } = req.body;
      await passwordResetService.resetPasswordWithOtp({
        email,
        otp,
        newPassword,
      });

      res.status(200).json({
        success: true,
        message:
          'Votre mot de passe a été réinitialisé avec succès.',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
