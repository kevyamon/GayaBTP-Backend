import { Types } from 'mongoose';
import { Alert, IAlert } from '../models/alert.model';
import { AppError } from '../utils/appError';
import { CreateAlertInput, UpdateAlertInput } from '../schemas/alert.schema';
import { logger } from '../utils/logger';

class AlertService {
  async createAlert(userId: string, input: CreateAlertInput): Promise<IAlert> {
    // Limite raisonnable de 20 alertes actives par utilisateur pour proteger la base
    const alertsCount = await Alert.countDocuments({ userId, isActive: true });
    if (alertsCount >= 20) {
      throw AppError.badRequest(
        'Vous avez atteint la limite maximale de 20 alertes actives. Veuillez en desactiver ou en supprimer pour en creer une nouvelle.'
      );
    }

    const alert = await Alert.create({
      ...input,
      userId,
    });

    logger.info('NOTIFICATION', `Nouvelle alerte budgetaire creee par ${userId} : ${alert.name}`);

    return alert;
  }

  async getUserAlerts(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [alerts, total] = await Promise.all([
      Alert.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Alert.countDocuments({ userId }),
    ]);

    return {
      alerts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getAlertById(userId: string, alertId: string): Promise<IAlert> {
    if (!Types.ObjectId.isValid(alertId)) {
      throw AppError.badRequest('Identifiant d alerte invalide.');
    }

    const alert = await Alert.findOne({ _id: alertId, userId }).lean();
    if (!alert) {
      throw AppError.notFound('Alerte introuvable.');
    }

    return alert as unknown as IAlert;
  }

  async updateAlert(
    userId: string,
    alertId: string,
    input: UpdateAlertInput
  ): Promise<IAlert> {
    if (!Types.ObjectId.isValid(alertId)) {
      throw AppError.badRequest('Identifiant d alerte invalide.');
    }

    const alert = await Alert.findOneAndUpdate(
      { _id: alertId, userId },
      { $set: input },
      { new: true, runValidators: true }
    );

    if (!alert) {
      throw AppError.notFound('Alerte introuvable.');
    }

    return alert;
  }

  async toggleAlertStatus(userId: string, alertId: string): Promise<IAlert> {
    if (!Types.ObjectId.isValid(alertId)) {
      throw AppError.badRequest('Identifiant d alerte invalide.');
    }

    const alert = await Alert.findOne({ _id: alertId, userId });
    if (!alert) {
      throw AppError.notFound('Alerte introuvable.');
    }

    alert.isActive = !alert.isActive;
    await alert.save();

    return alert;
  }

  async deleteAlert(userId: string, alertId: string): Promise<void> {
    if (!Types.ObjectId.isValid(alertId)) {
      throw AppError.badRequest('Identifiant d alerte invalide.');
    }

    const deleted = await Alert.findOneAndDelete({ _id: alertId, userId });
    if (!deleted) {
      throw AppError.notFound('Alerte introuvable.');
    }
  }
}

export const alertService = new AlertService();
