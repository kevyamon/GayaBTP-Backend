import { Types, FilterQuery } from 'mongoose';
import { ProProfile, IProProfile, IProService, IProProject } from '../models/proProfile.model';
import { subscriptionService } from './subscription.service';
import { AppError } from '../utils/appError';
import {
  UpdateProProfileInput,
  AddServiceInput,
  AddProjectInput,
  QueryProsInput,
} from '../schemas/pro.schema';

interface PaginatedProsResult {
  pros: Partial<IProProfile>[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ProService {
  async getPublicPros(filters: QueryProsInput): Promise<PaginatedProsResult> {
    const query: FilterQuery<IProProfile> = { isActive: true };

    if (filters.specialty) {
      query.specialties = filters.specialty;
    }

    if (filters.city) {
      query.city = new RegExp(`^${filters.city.trim()}$`, 'i');
    }

    if (filters.district) {
      query.district = new RegExp(`^${filters.district.trim()}$`, 'i');
    }

    if (filters.isVerified !== undefined) {
      query.isVerified = filters.isVerified;
    }

    if (filters.search) {
      const searchRegex = new RegExp(filters.search.trim(), 'i');
      query.$or = [
        { companyName: searchRegex },
        { bio: searchRegex },
        { specialties: searchRegex },
      ];
    }

    const skip = (filters.page - 1) * filters.limit;

    const [pros, total] = await Promise.all([
      ProProfile.find(query)
        .populate('userId', 'name avatar')
        .sort({ isVerified: -1, createdAt: -1 })
        .skip(skip)
        .limit(filters.limit)
        .lean() as unknown as Partial<IProProfile>[],
      ProProfile.countDocuments(query),
    ]);

    return {
      pros,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit) || 1,
      },
    };
  }

  async getPublicProById(id: string): Promise<IProProfile> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Identifiant professionnel invalide.');
    }

    const pro = await ProProfile.findById(id)
      .populate('userId', 'name avatar email phone')
      .lean();

    if (!pro || !pro.isActive) {
      throw AppError.notFound('Profil professionnel introuvable ou desactive.');
    }

    return pro as unknown as IProProfile;
  }

  async getMyProProfile(userId: string) {
    const proProfile = await ProProfile.findOne({ userId }).lean();
    if (!proProfile) {
      throw AppError.notFound('Profil professionnel introuvable.');
    }

    const quotas = await subscriptionService.getEffectiveQuotas(userId);

    return {
      profile: proProfile,
      quotas,
    };
  }

  async updateMyProfile(userId: string, input: UpdateProProfileInput): Promise<IProProfile> {
    if (input.bio) {
      await subscriptionService.checkBioLength(input.bio, userId);
    }

    const updated = await ProProfile.findOneAndUpdate(
      { userId },
      { $set: input },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw AppError.notFound('Profil professionnel introuvable.');
    }

    return updated;
  }

  async addService(userId: string, input: AddServiceInput): Promise<IProService> {
    const proProfile = await ProProfile.findOne({ userId });
    if (!proProfile) {
      throw AppError.notFound('Profil professionnel introuvable.');
    }

    // Verification du quota d'abonnement
    await subscriptionService.checkCanAddService(proProfile);

    const newService = {
      _id: new Types.ObjectId(),
      ...input,
    };

    proProfile.services.push(newService);
    await proProfile.save();

    return newService;
  }

  async deleteService(userId: string, serviceId: string): Promise<void> {
    if (!Types.ObjectId.isValid(serviceId)) {
      throw AppError.badRequest('Identifiant de service invalide.');
    }

    const proProfile = await ProProfile.findOne({ userId });
    if (!proProfile) {
      throw AppError.notFound('Profil professionnel introuvable.');
    }

    proProfile.services = proProfile.services.filter(
      (s) => s._id?.toString() !== serviceId
    );

    await proProfile.save();
  }

  async addProject(userId: string, input: AddProjectInput): Promise<IProProject> {
    // Verification du quota de photos par projet
    if (input.photos && input.photos.length > 0) {
      await subscriptionService.checkCanAddProjectPhotos(input.photos.length, userId);
    }

    const proProfile = await ProProfile.findOne({ userId });
    if (!proProfile) {
      throw AppError.notFound('Profil professionnel introuvable.');
    }

    const newProject = {
      _id: new Types.ObjectId(),
      ...input,
    };

    proProfile.projects.push(newProject);
    await proProfile.save();

    return newProject;
  }

  async deleteProject(userId: string, projectId: string): Promise<void> {
    if (!Types.ObjectId.isValid(projectId)) {
      throw AppError.badRequest('Identifiant de projet invalide.');
    }

    const proProfile = await ProProfile.findOne({ userId });
    if (!proProfile) {
      throw AppError.notFound('Profil professionnel introuvable.');
    }

    proProfile.projects = proProfile.projects.filter(
      (p) => p._id?.toString() !== projectId
    );

    await proProfile.save();
  }
}

export const proService = new ProService();
