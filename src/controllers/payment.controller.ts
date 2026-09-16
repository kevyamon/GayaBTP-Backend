import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service';
import { verificationService } from '../services/verification.service';
import { geniusPayService } from '../services/geniusPay.service';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

class PaymentController {
  async initiatePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const result = await paymentService.initiateSubscriptionPayment(
        req.user.userId,
        req.body
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async handleGeniusPayWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = (req.headers['x-webhook-signature'] ||
        req.headers['x-geniuspay-signature'] ||
        req.headers['x-signature'] ||
        '') as string;
      const timestamp = (req.headers['x-webhook-timestamp'] || '') as string;

      const rawBody = JSON.stringify(req.body);
      const isSignatureValid = geniusPayService.verifyWebhookSignature(
        rawBody,
        signature,
        timestamp
      );

      if (!isSignatureValid) {
        logger.warn('PAYMENT', 'Webhook Genius Pay rejeté : Signature cryptographique ou timestamp invalide.');
        res.status(401).json({ error: 'Signature invalide.' });
        return;
      }

      await paymentService.processGeniusPayWebhook(req.body);
      res.status(200).json({ success: true, received: true });
    } catch (error) {
      next(error);
    }
  }

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
