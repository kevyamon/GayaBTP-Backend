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
          'Jeton de rafraichissement absent. Veuillez vous reconnecter.'
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
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie(REFRESH_COOKIE_NAME, {
        path: '/api/v1/auth',
      });

      res.status(200).json({
        success: true,
        data: {
          message: 'Deconnexion effectuee avec succes.',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Utilisateur non authentifie.');
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
          'Si cette adresse est enregistree, un e-mail contenant le code de securite vient d etre envoye.',
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
          'Votre mot de passe a ete reinitialise avec succes. Vous pouvez vous connecter avec vos nouveaux identifiants.',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
