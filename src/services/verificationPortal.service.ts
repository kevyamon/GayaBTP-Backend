import { Types } from 'mongoose';
import { VerificationPortal, IVerificationPortal } from '../models/verificationPortal.model';
import { AppError } from '../utils/appError';

class VerificationPortalService {
  async getPublicPortals(): Promise<IVerificationPortal[]> {
    return VerificationPortal.find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .lean() as unknown as IVerificationPortal[];
  }

  async getAllPortalsAdmin(): Promise<IVerificationPortal[]> {
    return VerificationPortal.find()
      .sort({ order: 1 })
      .lean() as unknown as IVerificationPortal[];
  }

  async createPortal(input: Partial<IVerificationPortal>): Promise<IVerificationPortal> {
    if (!input.name || !input.url || !input.officialEntity || !input.description) {
      throw AppError.badRequest(
        'Nom, URL, entite officielle et description sont obligatoires.'
      );
    }

    const slug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return VerificationPortal.create({
      ...input,
      slug,
      isActive: input.isActive ?? true,
    });
  }

  async updatePortal(
    id: string,
    input: Partial<IVerificationPortal>
  ): Promise<IVerificationPortal> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Identifiant de portail invalide.');
    }

    const portal = await VerificationPortal.findByIdAndUpdate(
      id,
      { $set: input },
      { new: true, runValidators: true }
    );

    if (!portal) {
      throw AppError.notFound('Portail officiel introuvable.');
    }

    return portal;
  }

  async deletePortal(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Identifiant de portail invalide.');
    }

    const deleted = await VerificationPortal.findByIdAndDelete(id);
    if (!deleted) {
      throw AppError.notFound('Portail officiel introuvable.');
    }
  }
}

export const verificationPortalService = new VerificationPortalService();
