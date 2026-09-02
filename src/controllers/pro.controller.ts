import { Request, Response, NextFunction } from 'express';
import { proService } from '../services/pro.service';
import { AppError } from '../utils/appError';
import { getParam } from '../utils/params.util';

class ProController {
  async getPros(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await proService.getPublicPros(req.query as never);
      res.status(200).json({
        success: true,
        data: result.pros,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pro = await proService.getPublicProById(getParam(req.params.id));
      res.status(200).json({
        success: true,
        data: pro,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyProProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const data = await proService.getMyProProfile(req.user.userId);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const updated = await proService.updateMyProfile(req.user.userId, req.body);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async addService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const newService = await proService.addService(req.user.userId, req.body);
      res.status(201).json({
        success: true,
        data: newService,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      await proService.deleteService(req.user.userId, getParam(req.params.id));
      res.status(200).json({
        success: true,
        data: { message: 'Service supprime avec succes.' },
      });
    } catch (error) {
      next(error);
    }
  }

  async addProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const newProject = await proService.addProject(req.user.userId, req.body);
      res.status(201).json({
        success: true,
        data: newProject,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      await proService.deleteProject(req.user.userId, getParam(req.params.id));
      res.status(200).json({
        success: true,
        data: { message: 'Projet supprime avec succes.' },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const proController = new ProController();
