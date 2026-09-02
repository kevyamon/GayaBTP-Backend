import { Types, FilterQuery } from 'mongoose';
import { BlogPost, IBlogPost, BlogCategory } from '../models/blogPost.model';
import { AppError } from '../utils/appError';

export interface QueryBlogInput {
  category?: BlogCategory;
  search?: string;
  tag?: string;
  page: number;
  limit: number;
}

interface PaginatedBlogResult {
  articles: Partial<IBlogPost>[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class BlogService {
  async getPublishedArticles(filters: QueryBlogInput): Promise<PaginatedBlogResult> {
    const query: FilterQuery<IBlogPost> = { status: 'published' };

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.tag) {
      query.tags = filters.tag.toLowerCase();
    }

    if (filters.search) {
      const searchRegex = new RegExp(filters.search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { excerpt: searchRegex },
        { content: searchRegex },
      ];
    }

    const skip = (filters.page - 1) * filters.limit;

    const [articles, total] = await Promise.all([
      BlogPost.find(query)
        .select('title slug excerpt coverImage category author publishedAt viewsCount tags')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(filters.limit)
        .lean() as unknown as Partial<IBlogPost>[],
      BlogPost.countDocuments(query),
    ]);

    return {
      articles,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit) || 1,
      },
    };
  }

  async getArticleBySlug(slug: string): Promise<IBlogPost> {
    const article = await BlogPost.findOneAndUpdate(
      { slug: slug.toLowerCase(), status: 'published' },
      { $inc: { viewsCount: 1 } },
      { new: true }
    ).lean();

    if (!article) {
      throw AppError.notFound('Article introuvable.');
    }

    return article as unknown as IBlogPost;
  }

  async getSimilarArticles(category: BlogCategory, currentSlug: string, limit: number = 3): Promise<Partial<IBlogPost>[]> {
    return BlogPost.find({
      category,
      slug: { $ne: currentSlug },
      status: 'published',
    })
      .select('title slug excerpt coverImage category publishedAt')
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean() as unknown as Partial<IBlogPost>[];
  }

  async createArticle(authorId: string, authorName: string, input: Partial<IBlogPost>): Promise<IBlogPost> {
    if (!input.title || !input.content || !input.excerpt || !input.category) {
      throw AppError.badRequest('Titre, contenu, resume et categorie sont obligatoires.');
    }

    // Generation automatique d'un slug propre et stable
    const baseSlug = input.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = baseSlug;
    let counter = 1;
    while (await BlogPost.exists({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return BlogPost.create({
      ...input,
      slug,
      author: authorName,
      authorId,
      status: input.status || 'published',
      publishedAt: input.status === 'published' ? new Date() : undefined,
    });
  }

  async updateArticle(id: string, input: Partial<IBlogPost>): Promise<IBlogPost> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Identifiant d article invalide.');
    }

    const article = await BlogPost.findByIdAndUpdate(
      id,
      { $set: input },
      { new: true, runValidators: true }
    );

    if (!article) {
      throw AppError.notFound('Article introuvable.');
    }

    return article;
  }

  async deleteArticle(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Identifiant d article invalide.');
    }

    const deleted = await BlogPost.findByIdAndDelete(id);
    if (!deleted) {
      throw AppError.notFound('Article introuvable.');
    }
  }
}

export const blogService = new BlogService();
