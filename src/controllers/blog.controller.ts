import { Request, Response, NextFunction } from 'express';
import { blogService } from '../services/blog.service';
import { AppError } from '../utils/appError';
import { BlogCategory } from '../models/blogPost.model';

class BlogController {
  async getArticles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 12;
      const category = req.query.category as BlogCategory | undefined;
      const search = req.query.search as string | undefined;
      const tag = req.query.tag as string | undefined;

      const result = await blogService.getPublishedArticles({
        page,
        limit,
        category,
        search,
        tag,
      });

      res.status(200).json({
        success: true,
        data: result.articles,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getArticleBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const article = await blogService.getArticleBySlug(req.params.slug);
      res.status(200).json({
        success: true,
        data: article,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSimilarArticles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = req.query.category as BlogCategory;
      const slug = req.params.slug;

      if (!category) {
        throw AppError.badRequest('La categorie est obligatoire pour trouver des articles similaires.');
      }

      const similar = await blogService.getSimilarArticles(category, slug);
      res.status(200).json({
        success: true,
        data: similar,
      });
    } catch (error) {
      next(error);
    }
  }

  async createArticle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      const article = await blogService.createArticle(
        req.user.userId,
        req.user.email,
        req.body
      );
      res.status(201).json({
        success: true,
        data: article,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateArticle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await blogService.updateArticle(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteArticle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await blogService.deleteArticle(req.params.id);
      res.status(200).json({
        success: true,
        data: { message: 'Article supprime avec succes.' },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const blogController = new BlogController();
