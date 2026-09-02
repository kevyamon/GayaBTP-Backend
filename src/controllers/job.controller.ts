import { Request, Response, NextFunction } from 'express';
import { jobService } from '../services/job.service';
import { AppError } from '../utils/appError';

class JobController {
  async getJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await jobService.getJobs(req.query as never);
      res.status(200).json({
        success: true,
        data: result.jobs,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getJobById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await jobService.getJobById(req.params.id);
      res.status(200).json({
        success: true,
        data: job,
      });
    } catch (error) {
      next(error);
    }
  }

  async createJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const job = await jobService.createJob(
        req.user.userId,
        req.user.role,
        req.body
      );
      res.status(201).json({
        success: true,
        data: job,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const updated = await jobService.updateJob(
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

  async deleteJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      await jobService.deleteJob(req.user.userId, req.user.role, req.params.id);
      res.status(200).json({
        success: true,
        data: { message: 'Offre supprimee avec succes.' },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      const result = await jobService.getMyJobs(req.user.userId, page, limit);
      res.status(200).json({
        success: true,
        data: result.jobs,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const jobController = new JobController();
