import { Types, FilterQuery } from 'mongoose';
import { JobOffer, IJobOffer } from '../models/jobOffer.model';
import { AppError } from '../utils/appError';
import { CreateJobInput, UpdateJobInput, QueryJobsInput } from '../schemas/job.schema';
import { logger } from '../utils/logger';

interface PaginatedJobsResult {
  jobs: Partial<IJobOffer>[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class JobService {
  async getJobs(filters: QueryJobsInput): Promise<PaginatedJobsResult> {
    const query: FilterQuery<IJobOffer> = {
      status: 'published',
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gte: new Date() } },
      ],
    };

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.specialty) {
      query.specialty = new RegExp(`^${filters.specialty.trim()}$`, 'i');
    }

    if (filters.city) {
      query.city = new RegExp(`^${filters.city.trim()}$`, 'i');
    }

    if (filters.isPaid !== undefined) {
      query.isPaid = filters.isPaid;
    }

    if (filters.search) {
      const searchRegex = new RegExp(filters.search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { specialty: searchRegex },
      ];
    }

    const skip = (filters.page - 1) * filters.limit;

    const [jobs, total] = await Promise.all([
      JobOffer.find(query)
        .populate('authorId', 'name avatar phone')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(filters.limit)
        .lean(),
      JobOffer.countDocuments(query),
    ]);

    return {
      jobs,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit) || 1,
      },
    };
  }

  async getJobById(id: string): Promise<IJobOffer> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Identifiant d offre invalide.');
    }

    const job = await JobOffer.findById(id)
      .populate('authorId', 'name avatar email phone')
      .lean();

    if (!job || job.status === 'archived') {
      throw AppError.notFound('Offre d emploi ou de stage introuvable.');
    }

    return job as unknown as IJobOffer;
  }

  async createJob(
    userId: string,
    userRole: string,
    input: CreateJobInput
  ): Promise<IJobOffer> {
    // Regle metier absolue : Seuls les professionnels ou admins peuvent publier une offre
    if (userRole !== 'professionnel' && userRole !== 'admin') {
      throw AppError.forbidden(
        'Seuls les acteurs professionnels sont autorises a publier des offres de stage ou d emploi.'
      );
    }

    const job = await JobOffer.create({
      ...input,
      authorId: userId,
      status: 'published',
      publishedAt: new Date(),
    });

    logger.info('SYSTEM', `Nouvelle offre BTP creee : ${job.title} [${job.type}] par ${userId}`);

    return job;
  }

  async updateJob(
    userId: string,
    userRole: string,
    jobId: string,
    input: UpdateJobInput
  ): Promise<IJobOffer> {
    if (!Types.ObjectId.isValid(jobId)) {
      throw AppError.badRequest('Identifiant d offre invalide.');
    }

    const job = await JobOffer.findById(jobId);
    if (!job) {
      throw AppError.notFound('Offre introuvable.');
    }

    if (job.authorId.toString() !== userId && userRole !== 'admin') {
      throw AppError.forbidden('Vous n etes pas autorise a modifier cette offre.');
    }

    Object.assign(job, input);
    await job.save();

    return job;
  }

  async deleteJob(
    userId: string,
    userRole: string,
    jobId: string
  ): Promise<void> {
    if (!Types.ObjectId.isValid(jobId)) {
      throw AppError.badRequest('Identifiant d offre invalide.');
    }

    const job = await JobOffer.findById(jobId);
    if (!job) {
      throw AppError.notFound('Offre introuvable.');
    }

    if (job.authorId.toString() !== userId && userRole !== 'admin') {
      throw AppError.forbidden('Vous n etes pas autorise a supprimer cette offre.');
    }

    job.status = 'archived';
    await job.save();
  }

  async getMyJobs(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      JobOffer.find({ authorId: userId, status: { $ne: 'archived' } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      JobOffer.countDocuments({ authorId: userId, status: { $ne: 'archived' } }),
    ]);

    return {
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}

export const jobService = new JobService();
