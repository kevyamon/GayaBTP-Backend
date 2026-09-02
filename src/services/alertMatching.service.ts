import { Alert, IAlert } from '../models/alert.model';
import { IListing } from '../models/listing.model';
import { Notification } from '../models/notification.model';
import { notificationService } from './notification.service';
import { logger } from '../utils/logger';

class AlertMatchingService {
  private isMatch(alert: IAlert, listing: IListing): boolean {
    // 1. Filtrage par type de bien
    if (alert.propertyType && alert.propertyType !== listing.propertyType) {
      return false;
    }

    // 2. Filtrage par ville (insensible a la casse)
    if (
      alert.city &&
      alert.city.trim().toLowerCase() !== listing.city.trim().toLowerCase()
    ) {
      return false;
    }

    // 3. Filtrage par commune / district
    if (
      alert.district &&
      listing.district &&
      alert.district.trim().toLowerCase() !== listing.district.trim().toLowerCase()
    ) {
      return false;
    }

    // 4. Filtrage par fourchette de prix
    if (alert.minPrice !== undefined && listing.priceFCFA < alert.minPrice) {
      return false;
    }
    if (alert.maxPrice !== undefined && listing.priceFCFA > alert.maxPrice) {
      return false;
    }

    // 5. Filtrage par surface minimale
    if (alert.minSurface !== undefined && listing.surfaceM2 < alert.minSurface) {
      return false;
    }

    // 6. Filtrage par type de titre foncier
    if (alert.titleType && alert.titleType !== listing.titleType) {
      return false;
    }

    return true;
  }

  async matchListingAgainstAlerts(listing: IListing): Promise<number> {
    try {
      // Recherche de toutes les alertes actives
      const activeAlerts = await Alert.find({ isActive: true });
      let matchedCount = 0;

      for (const alert of activeAlerts) {
        // Ne pas alerter le proprietaire sur sa propre annonce
        if (alert.userId.toString() === listing.ownerId.toString()) {
          continue;
        }

        if (this.isMatch(alert, listing)) {
          // Regle d'Idempotence et non-duplication : verifier si une notification existe deja
          const alreadyNotified = await Notification.exists({
            userId: alert.userId,
            type: 'ALERT_MATCH',
            'data.listingId': listing._id.toString(),
            'data.alertId': alert._id.toString(),
          });

          if (!alreadyNotified) {
            await notificationService.createNotification({
              userId: alert.userId,
              type: 'ALERT_MATCH',
              title: `Nouvelle offre pour votre alerte : ${alert.name}`,
              message: `Un bien correspondant a vos criteres (${listing.title} a ${listing.city}) est desormais disponible au prix de ${listing.priceFCFA.toLocaleString('fr-FR')} FCFA.`,
              data: {
                listingId: listing._id.toString(),
                alertId: alert._id.toString(),
                propertyType: listing.propertyType,
                city: listing.city,
                priceFCFA: listing.priceFCFA,
              },
            });

            await Alert.findByIdAndUpdate(alert._id, {
              $set: { lastTriggeredAt: new Date() },
            });

            matchedCount++;
          }
        }
      }

      logger.info(
        'NOTIFICATION',
        `Moteur d alertes : ${matchedCount} notification(s) envoyee(s) pour l annonce ${listing._id}`
      );

      return matchedCount;
    } catch (error) {
      logger.error('SYSTEM', 'Erreur lors de l execution du moteur de matching d alertes', error);
      return 0;
    }
  }
}

export const alertMatchingService = new AlertMatchingService();
