import { Request, Response, NextFunction } from 'express';
import { userPublicService } from '../services/userPublic.service';

export class UserPublicController {
  async getPublicProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const profile = await userPublicService.getPublicProfile(id);
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userPublicController = new UserPublicController();
