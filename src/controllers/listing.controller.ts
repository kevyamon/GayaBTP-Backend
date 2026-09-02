import { Request, Response, NextFunction } from 'express';
import { listingService } from '../services/listing.service';
import { AppError } from '../utils/appError';

class ListingController {
  async getListings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await listingService.getListings(req.query as never);
      res.status(200).json({
        success: true,
        data: result.listings,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getListingById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const listing = await listingService.getListingById(req.params.id);
      res.status(200).json({
        success: true,
        data: listing,
      });
    } catch (error) {
      next(error);
    }
  }

  async createListing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const listing = await listingService.createListing(req.user.userId, req.body);
      res.status(201).json({
        success: true,
        data: listing,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateListing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const updated = await listingService.updateListing(
        req.user.userId,
        req.user.role,
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

  async deleteListing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      await listingService.deleteListing(req.user.userId, req.user.role, req.params.id);
      res.status(200).json({
        success: true,
        data: { message: 'Annonce supprimee / archivee avec succes.' },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyListings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      const result = await listingService.getMyListings(req.user.userId, page, limit);
      res.status(200).json({
        success: true,
        data: result.listings,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const listingController = new ListingController();
