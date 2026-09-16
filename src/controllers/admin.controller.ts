import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { adminAuthService } from '../services/adminAuth.service';
import { adminUserService } from '../services/adminUser.service';
import { paymentService } from '../services/payment.service';
import { verificationService } from '../services/verification.service';
import {
  REFRESH_COOKIE_NAME,
  getRefreshCookieOptions,
} from '../utils/token.util';
import { AppError } from '../utils/appError';
import { getParam } from '../utils/params.util';

class AdminController {
  // ==========================================
  // 1. AUTHENTIFICATION & INVITATIONS ADMIN
  // ==========================================

  async checkSetupStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const superAdminExists = await adminAuthService.checkSuperAdminExists();
      res.status(200).json({ success: true, data: { superAdminExists } });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminAuthService.login(req.body);

      res.cookie(
        REFRESH_COOKIE_NAME,
        result.tokens.refreshToken,
        getRefreshCookieOptions()
      );

      res.status(200).json({
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

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminAuthService.register(req.body);

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

  async createInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const invitation = await adminAuthService.createInvitation(
        req.user.userId,
        req.user.email,
        req.body
      );
      res.status(201).json({ success: true, data: invitation });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // 2. DASHBOARD STATS
  // ==========================================

  async getDashboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await adminService.getDashboardStats();
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // 3. GESTION APPROFONDIE DES UTILISATEURS
  // ==========================================

  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const result = await adminUserService.getUsers(
        page,
        limit,
        req.query.search as string,
        req.query.role as never,
        req.query.status as never
      );
      res.status(200).json({ success: true, data: result.users, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async getUserDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const details = await adminUserService.getUserDetails(getParam(req.params.id));
      res.status(200).json({ success: true, data: details });
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const user = await adminUserService.updateUserStatus(
        getParam(req.params.id),
        req.body.status,
        req.body.reason,
        req.user.userId,
        req.user.email
      );
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const user = await adminUserService.updateUserRole(
        getParam(req.params.id),
        req.body.role,
        req.body.reason,
        req.user.userId,
        req.user.email
      );
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async banUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const user = await adminUserService.banUser(
        getParam(req.params.id),
        req.body.reason,
        req.user.userId,
        req.user.email
      );
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // 4. ANNONCES, PAIEMENTS & CERTIFICATIONS
  // ==========================================

  async getListings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const result = await adminService.getListings(page, limit, req.query.status as never);
      res.status(200).json({ success: true, data: result.listings, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async moderateListing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const listing = await adminService.moderateListing(
        getParam(req.params.id),
        req.body.status,
        req.user.userId,
        req.user.email
      );
      res.status(200).json({ success: true, data: listing });
    } catch (error) {
      next(error);
    }
  }

  async getPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const result = await adminService.getPayments(page, limit, req.query.status as never);
      res.status(200).json({ success: true, data: result.payments, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const payment = await paymentService.adminVerifyPayment(
        req.user.userId,
        req.user.email,
        getParam(req.params.id),
        req.body.action,
        req.body.notes
      );
      res.status(200).json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }

  async getVerifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const result = await adminService.getVerifications(page, limit, req.query.status as never);
      res.status(200).json({ success: true, data: result.verifications, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async reviewVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const request = await verificationService.adminReviewRequest(
        req.user.userId,
        req.user.email,
        getParam(req.params.id),
        req.body.action,
        req.body.notes
      );
      res.status(200).json({ success: true, data: request });
    } catch (error) {
      next(error);
    }
  }

  async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 30;
      const result = await adminService.getAuditLogs(page, limit);
      res.status(200).json({ success: true, data: result.logs, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
