import { Types, FilterQuery } from 'mongoose';
import { Listing, IListing } from '../models/listing.model';
import { alertMatchingService } from './alertMatching.service';
import { AppError } from '../utils/appError';
import {
  CreateListingInput,
  UpdateListingInput,
  QueryListingsInput,
} from '../schemas/listing.schema';

interface PaginatedListingsResult {
  listings: Partial<IListing>[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ListingService {
  async getListings(filters: QueryListingsInput): Promise<PaginatedListingsResult> {
    const query: FilterQuery<IListing> = { status: 'published' };

    if (filters.propertyType) {
      query.propertyType = filters.propertyType;
    }

    if (filters.city) {
      query.city = new RegExp(`^${filters.city.trim()}$`, 'i');
    }

    if (filters.district) {
      query.district = new RegExp(`^${filters.district.trim()}$`, 'i');
    }

    if (filters.titleType) {
      query.titleType = filters.titleType;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.priceFCFA = {};
      if (filters.minPrice !== undefined) query.priceFCFA.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) query.priceFCFA.$lte = filters.maxPrice;
    }

    if (filters.minSurface !== undefined) {
      query.surfaceM2 = { $gte: filters.minSurface };
    }

    if (filters.search) {
      const searchRegex = new RegExp(filters.search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { neighborhood: searchRegex },
      ];
    }

    // Gestion du tri
    let sortOption: Record<string, 1 | -1> = { publishedAt: -1 };
    if (filters.sort === 'price_asc') sortOption = { priceFCFA: 1 };
    if (filters.sort === 'price_desc') sortOption = { priceFCFA: -1 };
    if (filters.sort === 'surface_desc') sortOption = { surfaceM2: -1 };

    const skip = (filters.page - 1) * filters.limit;

    const [listings, total] = await Promise.all([
      Listing.find(query)
        .populate('ownerId', 'name phone avatar')
        .sort(sortOption)
        .skip(skip)
        .limit(filters.limit)
        .lean() as unknown as Partial<IListing>[],
      Listing.countDocuments(query),
    ]);

    return {
      listings,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit) || 1,
      },
    };
  }

  async getListingById(id: string): Promise<IListing> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Identifiant d annonce invalide.');
    }

    const listing = await Listing.findById(id)
      .populate('ownerId', 'name phone avatar email')
      .lean();

    if (!listing || listing.status === 'archived') {
      throw AppError.notFound('Annonce introuvable ou archivee.');
    }

    return listing as unknown as IListing;
  }

  async createListing(userId: string, input: CreateListingInput): Promise<IListing> {
    const listing = await Listing.create({
      ...input,
      ownerId: userId,
      status: 'published',
      publishedAt: new Date(),
    });

    // Declenchement asynchrone du moteur de matching des alertes budgetaires
    setImmediate(() => {
      alertMatchingService.matchListingAgainstAlerts(listing);
    });

    return listing;
  }

  async updateListing(
    userId: string,
    userRole: string,
    listingId: string,
    input: UpdateListingInput
  ): Promise<IListing> {
    if (!Types.ObjectId.isValid(listingId)) {
      throw AppError.badRequest('Identifiant d annonce invalide.');
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      throw AppError.notFound('Annonce introuvable.');
    }

    // Seul le proprietaire ou un administrateur peut modifier
    if (listing.ownerId.toString() !== userId && userRole !== 'admin') {
      throw AppError.forbidden('Vous n etes pas autorise a modifier cette annonce.');
    }

    Object.assign(listing, input);
    await listing.save();

    return listing;
  }

  async deleteListing(userId: string, userRole: string, listingId: string): Promise<void> {
    if (!Types.ObjectId.isValid(listingId)) {
      throw AppError.badRequest('Identifiant d annonce invalide.');
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      throw AppError.notFound('Annonce introuvable.');
    }

    if (listing.ownerId.toString() !== userId && userRole !== 'admin') {
      throw AppError.forbidden('Vous n etes pas autorise a supprimer cette annonce.');
    }

    // Archivage logique plutot que suppression brute
    listing.status = 'archived';
    await listing.save();
  }

  async getMyListings(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      Listing.find({ ownerId: userId, status: { $ne: 'archived' } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Listing.countDocuments({ ownerId: userId, status: { $ne: 'archived' } }),
    ]);

    return {
      listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}

export const listingService = new ListingService();
