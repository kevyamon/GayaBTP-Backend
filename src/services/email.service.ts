import axios from 'axios';
import { env } from '../config/env.config';
import { logger } from '../utils/logger';
import {
  getOtpEmailHtml,
  getPasswordChangedAlertHtml,
  getWelcomeEmailHtml,
  getSubscriptionReceiptHtml,
  getAdminSecurityAlertHtml,
  SubscriptionReceiptPayload,
  AdminSecurityAlertPayload,
} from '../utils/emailTemplates';
import {
  getVerificationSubmittedHtml,
  getVerificationApprovedHtml,
  getVerificationRejectedHtml,
  getListingAlertMatchHtml,
  ListingAlertMatchPayload,
} from '../utils/verificationEmailTemplates';

interface SendEmailPayload {
  to: string;
  subject: string;
  htmlContent: string;
}

class EmailService {
  private readonly brevoApiUrl = 'https://api.brevo.com/v3/smtp/email';

  /**
   * Envoi générique d'un e-mail transactionnel via l'API REST HTTPS de Brevo (Port 443)
   */
  async sendEmail(payload: SendEmailPayload): Promise<boolean> {
    if (!env.BREVO_API_KEY) {
      logger.warn(
        'NOTIFICATION',
        'BREVO_API_KEY non configurée. Envoi d e-mail simulé.',
        { to: payload.to, subject: payload.subject }
      );
      return true;
    }

    try {
      await axios.post(
        this.brevoApiUrl,
        {
          sender: {
            email: env.EMAIL_FROM,
            name: env.EMAIL_FROM_NAME,
          },
          to: [{ email: payload.to }],
          subject: payload.subject,
          htmlContent: payload.htmlContent,
        },
        {
          headers: {
            accept: 'application/json',
            'api-key': env.BREVO_API_KEY,
            'content-type': 'application/json',
          },
          timeout: 10000,
        }
      );

      logger.info('NOTIFICATION', `E-mail envoyé avec succès à ${payload.to}`);
      return true;
    } catch (error: unknown) {
      const errorDetails = axios.isAxiosError(error)
        ? error.response?.data || error.message
        : error;

      logger.error(
        'NOTIFICATION',
        `Échec de l envoi d e-mail à ${payload.to}`,
        errorDetails
      );
      throw new Error('Échec de l envoi du courriel.');
    }
  }

  /**
   * 1. Envoi du code de sécurité OTP pour la réinitialisation de mot de passe
   */
  async sendOtpEmail(to: string, otp: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `Code de sécurité pour votre mot de passe : ${otp}`,
      htmlContent: getOtpEmailHtml(otp),
    });
  }

  /**
   * 2. Envoi de l'alerte de sécurité lors du changement de mot de passe
   */
  async sendPasswordChangedAlert(to: string, userName: string): Promise<boolean> {
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return this.sendEmail({
      to,
      subject: 'Alerte de sécurité GayaBTP : Votre mot de passe a été modifié',
      htmlContent: getPasswordChangedAlertHtml(userName, dateFormatted),
    });
  }

  /**
   * 3. Envoi de l'e-mail de bienvenue & onboarding lors de l'inscription
   */
  async sendWelcomeEmail(
    to: string,
    userName: string,
    role: 'particulier' | 'professionnel'
  ): Promise<boolean> {
    const subject =
      role === 'professionnel'
        ? 'Bienvenue sur GayaBTP — Votre vitrine professionnelle BTP est prête'
        : 'Bienvenue sur GayaBTP — Découvrez vos services BTP et immobiliers';

    return this.sendEmail({
      to,
      subject,
      htmlContent: getWelcomeEmailHtml(userName, role),
    });
  }

  /**
   * 4. Envoi du reçu officiel et confirmation d'abonnement B2B
   */
  async sendSubscriptionConfirmationEmail(
    to: string,
    data: SubscriptionReceiptPayload
  ): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `Confirmation de votre abonnement GayaBTP — Formule ${data.planName}`,
      htmlContent: getSubscriptionReceiptHtml(data),
    });
  }

  /**
   * 5. Accusé de réception de dossier de certification
   */
  async sendVerificationSubmittedEmail(
    to: string,
    userName: string,
    companyName: string
  ): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'Dossier de certification reçu — Instruction en cours (GayaBTP)',
      htmlContent: getVerificationSubmittedHtml(userName, companyName),
    });
  }

  /**
   * 6. Validation de certification et attribution du Badge Vérifié
   */
  async sendVerificationApprovedEmail(
    to: string,
    userName: string,
    companyName: string
  ): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'Félicitations ! Votre Badge Professionnel Vérifié est actif sur GayaBTP',
      htmlContent: getVerificationApprovedHtml(userName, companyName),
    });
  }

  /**
   * 7. Information de rejet motivé ou pièces complémentaires requises
   */
  async sendVerificationRejectedEmail(
    to: string,
    userName: string,
    companyName: string,
    reason?: string
  ): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'Information relative à votre dossier de certification (GayaBTP)',
      htmlContent: getVerificationRejectedHtml(userName, companyName, reason),
    });
  }

  /**
   * 8. Alerte de nouvelle annonce correspondant aux critères d'un acquéreur
   */
  async sendListingAlertMatchEmail(
    to: string,
    data: ListingAlertMatchPayload
  ): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `Nouvelle offre correspondant à votre alerte : ${data.alertName}`,
      htmlContent: getListingAlertMatchHtml(data),
    });
  }

  /**
   * 9. Envoi d une alerte critique de sécurité système à l administrateur
   */
  async sendAdminSecurityAlert(payload: AdminSecurityAlertPayload): Promise<boolean> {
    const adminEmail = env.ADMIN_EMAIL || env.EMAIL_FROM;
    return this.sendEmail({
      to: adminEmail,
      subject: `[ALERTE SECURITE GAYABTP] ${payload.incidentType}`,
      htmlContent: getAdminSecurityAlertHtml(payload),
    });
  }
}

export const emailService = new EmailService();
export {
  SubscriptionReceiptPayload,
  ListingAlertMatchPayload,
  AdminSecurityAlertPayload,
};
