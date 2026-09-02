import { Request, Response, NextFunction } from 'express';
import { schoolService } from '../services/school.service';
import { getParam } from '../utils/params.util';

class SchoolController {
  async getSchools(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const city = req.query.city as string | undefined;
      const specialty = req.query.specialty as string | undefined;
      const search = req.query.search as string | undefined;

      const result = await schoolService.getSchools({
        page,
        limit,
        city,
        specialty,
        search,
      });

      res.status(200).json({
        success: true,
        data: result.schools,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSchoolById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await schoolService.getSchoolById(getParam(req.params.id));
      res.status(200).json({
        success: true,
        data: school,
      });
    } catch (error) {
      next(error);
    }
  }

  async createSchool(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await schoolService.createSchool(req.body);
      res.status(201).json({
        success: true,
        data: school,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSchool(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await schoolService.updateSchool(getParam(req.params.id), req.body);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteSchool(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await schoolService.deleteSchool(getParam(req.params.id));
      res.status(200).json({
        success: true,
        data: { message: 'Etablissement supprime avec succes.' },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const schoolController = new SchoolController();
