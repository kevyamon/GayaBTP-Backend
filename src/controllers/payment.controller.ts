import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service';
import { verificationService } from '../services/verification.service';
import { AppError } from '../utils/appError';

class PaymentController {
  async submitPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const payment = await paymentService.submitPayment(req.user.userId, req.body);
      res.status(201).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      const result = await paymentService.getUserPayments(req.user.userId, page, limit);
      res.status(200).json({
        success: true,
        data: result.payments,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async submitVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const request = await verificationService.submitRequest(req.user.userId, req.body);
      res.status(201).json({
        success: true,
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const request = await verificationService.getMyRequest(req.user.userId);
      res.status(200).json({
        success: true,
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
