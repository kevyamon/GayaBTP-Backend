import { Types, FilterQuery } from 'mongoose';
import { School, ISchool } from '../models/school.model';
import { AppError } from '../utils/appError';

export interface QuerySchoolsInput {
  city?: string;
  specialty?: string;
  search?: string;
  page: number;
  limit: number;
}

interface PaginatedSchoolsResult {
  schools: Partial<ISchool>[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class SchoolService {
  async getSchools(filters: QuerySchoolsInput): Promise<PaginatedSchoolsResult> {
    const query: FilterQuery<ISchool> = { status: 'published' };

    if (filters.city) {
      query.city = new RegExp(`^${filters.city.trim()}$`, 'i');
    }

    if (filters.specialty) {
      query.specialties = filters.specialty;
    }

    if (filters.search) {
      const searchRegex = new RegExp(filters.search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { address: searchRegex },
      ];
    }

    const skip = (filters.page - 1) * filters.limit;

    const [schools, total] = await Promise.all([
      School.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(filters.limit)
        .lean(),
      School.countDocuments(query),
    ]);

    return {
      schools,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit) || 1,
      },
    };
  }

  async getSchoolById(id: string): Promise<ISchool> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Identifiant d etablissement invalide.');
    }

    const school = await School.findById(id).lean();
    if (!school || school.status === 'archived') {
      throw AppError.notFound('Etablissement introuvable.');
    }

    return school as unknown as ISchool;
  }

  async createSchool(input: Partial<ISchool>): Promise<ISchool> {
    return School.create({
      ...input,
      status: 'published',
    });
  }

  async updateSchool(id: string, input: Partial<ISchool>): Promise<ISchool> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Identifiant d etablissement invalide.');
    }

    const school = await School.findByIdAndUpdate(
      id,
      { $set: input },
      { new: true, runValidators: true }
    );

    if (!school) {
      throw AppError.notFound('Etablissement introuvable.');
    }

    return school;
  }

  async deleteSchool(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Identifiant d etablissement invalide.');
    }

    const deleted = await School.findByIdAndDelete(id);
    if (!deleted) {
      throw AppError.notFound('Etablissement introuvable.');
    }
  }
}

export const schoolService = new SchoolService();
