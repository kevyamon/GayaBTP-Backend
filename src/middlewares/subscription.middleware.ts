import { Request, Response, NextFunction } from 'express';
import { systemSettingService } from '../services/systemSetting.service';
import { Subscription, ISubscription } from '../models/subscription.model';
import { AppError } from '../utils/appError';

// Extension de l'interface Request pour optionnellement inclure l'abonnement
declare global {
  namespace Express {
    interface Request {
      subscription?: ISubscription;
    }
  }
}

export const requireActiveSubscriptionOrFreeMode = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Vérification prioritaire du Mode Gratuit global
    const isFreeMode = await systemSettingService.isFreeModeActive();
    if (isFreeMode) {
      return next();
    }

    // 2. Si le mode payant est actif, l'utilisateur doit être authentifié
    if (!req.user) {
      throw AppError.unauthorized('Authentification requise.');
    }

    // 3. Les administrateurs ont toujours accès
    if (req.user.role === 'admin') {
      return next();
    }

    // 4. Vérification de l'abonnement en base de données
    const now = new Date();
    const activeSubscription = await Subscription.findOne({
      userId: req.user.userId,
      status: 'active',
      endDate: { $gte: now },
    });

    if (!activeSubscription) {
      throw AppError.forbidden(
        'Cette action nécessite un abonnement GayaBTP actif. Veuillez souscrire à une formule pour continuer.'
      );
    }

    req.subscription = activeSubscription;
    next();
  } catch (error) {
    next(error);
  }
};
