import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.model';
import { emailService } from './email.service';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export interface ResetPasswordInput {
  email: string;
  otp: string;
  newPassword: string;
}

class PasswordResetService {
  /**
   * 1. Demande de réinitialisation de mot de passe (Forgot Password)
   * Génère un OTP à 6 chiffres, le hache avec Bcrypt et l'envoie par e-mail via Brevo.
   * Répond toujours avec succès pour empêcher l'énumération des comptes.
   */
  async requestResetOtp(email: string): Promise<boolean> {
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    // Sécurité Anti-énumération : si le compte n'existe pas ou est suspendu,
    // on retourne immédiatement un statut positif sans révéler l'état du compte.
    if (!user || user.status === 'suspended') {
      logger.info(
        'SECURITY',
        `Demande de réinitialisation pour une adresse inconnue ou suspendue : ${cleanEmail}`
      );
      return true;
    }

    // Génération d'un OTP cryptographique aléatoire à 6 chiffres
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Hachage du code OTP avec 12 rounds de salage avant écriture en base
    const salt = await bcrypt.genSalt(12);
    user.resetPasswordOtp = await bcrypt.hash(otp, salt);
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Sauvegarde sans déclencher la validation complète de l'utilisateur
    await user.save({ validateBeforeSave: false });

    try {
      await emailService.sendOtpEmail(user.email, otp);
      logger.info('AUTH', `Code OTP de réinitialisation envoyé à ${user.email}`);
    } catch (error) {
      // Rollback immédiat des champs en cas d'échec d'acheminement de l'e-mail
      user.resetPasswordOtp = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      logger.error('AUTH', `Échec d'envoi du code OTP à ${user.email}`, error);
      throw AppError.internal(
        'Impossible d envoyer le courriel de sécurité pour le moment. Veuillez réessayer.'
      );
    }

    return true;
  }

  /**
   * 2. Validation de l'OTP et Définition du Nouveau Mot de Passe (Reset Password)
   * Valide l'OTP, révoque les sessions actives et met à jour le mot de passe.
   */
  async resetPasswordWithOtp(input: ResetPasswordInput): Promise<boolean> {
    const cleanEmail = input.email.toLowerCase().trim();

    // Récupération explicite des champs sécurisés masqués par défaut
    const user = await User.findOne({ email: cleanEmail }).select(
      '+password +resetPasswordOtp +resetPasswordExpires'
    );

    // Vérification de l'existence, du statut et de la date d'expiration
    if (
      !user ||
      user.status === 'suspended' ||
      !user.resetPasswordOtp ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires.getTime() < Date.now()
    ) {
      throw AppError.badRequest(
        'Le code de sécurité est invalide ou a expiré. Veuillez refaire une demande.'
      );
    }

    // Comparaison cryptographique sécurisée à temps constant de l'OTP
    const isOtpValid = await bcrypt.compare(
      input.otp.trim(),
      user.resetPasswordOtp
    );

    if (!isOtpValid) {
      logger.warn(
        'SECURITY',
        `Tentative de validation OTP invalide pour l adresse ${cleanEmail}`
      );
      throw AppError.badRequest(
        'Le code de sécurité est invalide ou a expiré. Veuillez refaire une demande.'
      );
    }

    // Mise à jour du mot de passe (sera haché par le middleware pre-save de Mongoose avec 12 rounds)
    user.password = input.newPassword;

    // Purge définitive des champs OTP
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;

    // Incrémentation de la version des jetons pour révoquer toutes les sessions existantes
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    await user.save();

    logger.info(
      'AUTH',
      `Mot de passe réinitialisé avec succès pour l utilisateur : ${user.email}`
    );

    // Envoi de l alerte de sécurité (non-bloquant pour la réponse utilisateur)
    emailService
      .sendPasswordChangedAlert(user.email, user.name)
      .catch((err) =>
        logger.error(
          'SECURITY',
          `Échec d envoi de l alerte de sécurité à ${user.email}`,
          err
        )
      );

    return true;
  }
}

export const passwordResetService = new PasswordResetService();
