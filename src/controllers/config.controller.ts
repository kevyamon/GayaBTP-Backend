import { Request, Response, NextFunction } from 'express';
import { systemSettingService } from '../services/systemSetting.service';
import { AppError } from '../utils/appError';

class ConfigController {
  async getPublicConfig(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = await systemSettingService.getPublicConfig();
      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAdminSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const settings = await systemSettingService.getSettings();
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateFreeMode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }

      const { isFreeModeEnabled, freeModeBannerMessage } = req.body;
      const adminIp = req.ip;

      const updated = await systemSettingService.updateFreeMode(
        req.user.userId,
        Boolean(isFreeModeEnabled),
        freeModeBannerMessage,
        adminIp
      );

      res.status(200).json({
        success: true,
        data: updated,
        message: `Mode gratuit ${isFreeModeEnabled ? 'active' : 'desactive'} avec succes.`,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const configController = new ConfigController();
