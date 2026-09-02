import { Request, Response, NextFunction } from 'express';
import { alertService } from '../services/alert.service';
import { AppError } from '../utils/appError';

class AlertController {
  async createAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const alert = await alertService.createAlert(req.user.userId, req.body);
      res.status(201).json({
        success: true,
        data: alert,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      const result = await alertService.getUserAlerts(req.user.userId, page, limit);
      res.status(200).json({
        success: true,
        data: result.alerts,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAlertById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const alert = await alertService.getAlertById(req.user.userId, req.params.id);
      res.status(200).json({
        success: true,
        data: alert,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const updated = await alertService.updateAlert(
        req.user.userId,
        req.params.id,
        req.body
      );
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const updated = await alertService.toggleAlertStatus(
        req.user.userId,
        req.params.id
      );
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      await alertService.deleteAlert(req.user.userId, req.params.id);
      res.status(200).json({
        success: true,
        data: { message: 'Alerte supprimee avec succes.' },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const alertController = new AlertController();
