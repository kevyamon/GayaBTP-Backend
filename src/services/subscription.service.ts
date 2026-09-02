import { Types } from 'mongoose';
import { Subscription } from '../models/subscription.model';
import { SubscriptionPlan, ISubscriptionPlan } from '../models/subscriptionPlan.model';
import { IProProfile } from '../models/proProfile.model';
import { AppError } from '../utils/appError';
import { env } from '../config/env.config';

export interface EffectiveQuotas {
  planName: string;
  planSlug: string;
  maxServices: number;
  maxBioChars: number;
  maxPhotosPerProject: number;
  visibility: string;
  hasProBadge: boolean;
}

class SubscriptionService {
  // Quotas par defaut pour le plan Starter
  private defaultStarterQuotas: EffectiveQuotas = {
    planName: 'Starter',
    planSlug: 'starter',
    maxServices: 3,
    maxBioChars: 300,
    maxPhotosPerProject: 2,
    visibility: 'standard',
    hasProBadge: false,
  };

  async getEffectiveQuotas(userId: Types.ObjectId | string): Promise<EffectiveQuotas> {
    // Si la plateforme est en mode gratuit, tous les professionnels beneficient de quotas etendus
    if (env.COMMERCIAL_MODE === 'free') {
      return {
        planName: 'Offre Decouverte Gratuite',
        planSlug: 'premium',
        maxServices: 50,
        maxBioChars: 2000,
        maxPhotosPerProject: 10,
        visibility: 'maximale',
        hasProBadge: true,
      };
    }

    // Recherche d'un abonnement actif
    const activeSub = await Subscription.findOne({
      userId,
      status: 'active',
      endDate: { $gte: new Date() },
    })
      .populate<{ planId: ISubscriptionPlan }>('planId')
      .lean();

    if (activeSub && activeSub.planId) {
      const plan = activeSub.planId;
      return {
        planName: plan.name,
        planSlug: plan.slug,
        maxServices: plan.maxServices,
        maxBioChars: plan.maxBioChars,
        maxPhotosPerProject: plan.maxPhotosPerProject,
        visibility: plan.visibility,
        hasProBadge: plan.hasProBadge,
      };
    }

    // Plan Starter par defaut si aucun abonnement payant actif
    const starterPlan = await SubscriptionPlan.findOne({ slug: 'starter' }).lean();
    if (starterPlan) {
      return {
        planName: starterPlan.name,
        planSlug: starterPlan.slug,
        maxServices: starterPlan.maxServices,
        maxBioChars: starterPlan.maxBioChars,
        maxPhotosPerProject: starterPlan.maxPhotosPerProject,
        visibility: starterPlan.visibility,
        hasProBadge: starterPlan.hasProBadge,
      };
    }

    return this.defaultStarterQuotas;
  }

  async checkCanAddService(proProfile: IProProfile): Promise<void> {
    const quotas = await this.getEffectiveQuotas(proProfile.userId);

    // -1 represente des services illimites
    if (quotas.maxServices !== -1 && proProfile.services.length >= quotas.maxServices) {
      throw AppError.planLimitReached(
        `Votre formule (${quotas.planName}) est limitee a ${quotas.maxServices} services. Veuillez mettre a niveau votre abonnement.`
      );
    }
  }

  async checkCanAddProjectPhotos(photosCount: number, userId: Types.ObjectId | string): Promise<void> {
    const quotas = await this.getEffectiveQuotas(userId);

    if (photosCount > quotas.maxPhotosPerProject) {
      throw AppError.planLimitReached(
        `Votre formule (${quotas.planName}) autorise un maximum de ${quotas.maxPhotosPerProject} photos par projet.`
      );
    }
  }

  async checkBioLength(bioText: string, userId: Types.ObjectId | string): Promise<void> {
    const quotas = await this.getEffectiveQuotas(userId);

    if (bioText.length > quotas.maxBioChars) {
      throw AppError.planLimitReached(
        `La description biographique depasse la limite de ${quotas.maxBioChars} caracteres autorisee par votre formule.`
      );
    }
  }
}

export const subscriptionService = new SubscriptionService();
