import { Types } from 'mongoose';
import { User } from '../models/user.model';
import { ProProfile } from '../models/proProfile.model';
import { Listing } from '../models/listing.model';
import { AppError } from '../utils/appError';

export interface PublicUserProfileResponse {
  user: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    role: string;
    avatar?: string;
    coverImage?: string;
    city?: string;
    bio?: string;
    createdAt: Date;
  };
  proProfile?: unknown;
  listings: unknown[];
}

class UserPublicService {
  async getPublicProfile(userId: string): Promise<PublicUserProfileResponse> {
    if (!Types.ObjectId.isValid(userId)) {
      throw AppError.badRequest("Identifiant d'utilisateur invalide.");
    }

    const user = await User.findById(userId)
      .select('name email phone role avatar coverImage city bio createdAt status')
      .lean();

    if (!user || user.status === 'banned') {
      throw AppError.notFound('Profil utilisateur introuvable ou indisponible.');
    }

    const [proProfile, listings] = await Promise.all([
      user.role === 'professionnel' ? ProProfile.findOne({ userId }).lean() : null,
      Listing.find({ ownerId: userId, status: 'published' })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

    return {
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        coverImage: user.coverImage,
        city: user.city,
        bio: user.bio,
        createdAt: user.createdAt,
      },
      proProfile: proProfile || undefined,
      listings,
    };
  }
}

export const userPublicService = new UserPublicService();
