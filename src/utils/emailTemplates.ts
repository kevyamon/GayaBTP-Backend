/**
 * Utilitaires de génération des gabarits HTML institutionnels pour les e-mails transactionnels GayaBTP.
 * Respect strict de la charte graphique, de la typographie française et interdiction totale d'emojis.
 */

const BASE_CONTAINER_START = (title: string): string => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:#0F172A; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding: 40px 15px;">
        <div style="max-width: 540px; width: 100%; background-color: #1E293B; border: 1px solid #334155; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.4);">
          
          <!-- En-tête officiel GayaBTP -->
          <div style="padding: 30px 24px 20px 24px; text-align: center; border-bottom: 1px solid #334155; background-color: #141E33;">
            <h2 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">
              Gaya<span style="color: #E99021;">BTP</span>
            </h2>
            <p style="margin: 6px 0 0 0; color: #94A3B8; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px;">
              Plateforme de Référence du BTP & de l Immobilier
            </p>
          </div>
`;

const BASE_CONTAINER_END = `
          <!-- Pied de page officiel -->
          <div style="background-color: #0F172A; padding: 20px 24px; text-align: center; border-top: 1px solid #334155;">
            <p style="color: #64748B; font-size: 11px; margin: 0; line-height: 18px;">
              GayaBTP — République de Côte d Ivoire.<br>
              Ceci est un message transactionnel sécurisé, merci de ne pas répondre directement à cet e-mail.
            </p>
          </div>

        </div>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * 1. Gabarit OTP - Réinitialisation de mot de passe
 */
export const getOtpEmailHtml = (otp: string): string => `
${BASE_CONTAINER_START('Code de sécurité pour votre mot de passe')}
  <div style="padding: 36px 28px; text-align: center;">
    <h1 style="color: #FFFFFF; font-size: 20px; margin: 0 0 12px 0; font-weight: 600;">
      Réinitialisation de votre mot de passe
    </h1>
    <p style="color: #CBD5E1; font-size: 14px; line-height: 22px; margin: 0 0 28px 0;">
      Saisissez le code de sécurité temporaire ci-dessous dans l application pour définir votre nouveau mot de passe :
    </p>

    <div style="display: inline-block; padding: 16px 36px; background-color: #0F172A; border: 2px solid #E99021; border-radius: 12px; margin-bottom: 28px;">
      <span style="font-size: 34px; font-weight: 700; letter-spacing: 8px; color: #E99021; font-family: monospace;">
        ${otp}
      </span>
    </div>

    <p style="color: #94A3B8; font-size: 12px; line-height: 19px; margin: 0;">
      Ce code confidentiel expire dans <strong>15 minutes</strong>.<br>
      Si vous n êtes pas à l origine de cette demande, vous pouvez ignorer ce message en toute sécurité.
    </p>
  </div>
${BASE_CONTAINER_END}
`;

/**
 * 2. Gabarit Alerte de Sécurité - Confirmation de Changement de Mot de Passe
 */
export const getPasswordChangedAlertHtml = (userName: string, dateFormatted: string): string => `
${BASE_CONTAINER_START('Alerte de sécurité — Mot de passe modifié')}
  <div style="padding: 36px 28px; text-align: left;">
    <h1 style="color: #FFFFFF; font-size: 19px; margin: 0 0 16px 0; font-weight: 600;">
      Alerte de sécurité du compte
    </h1>
    <p style="color: #CBD5E1; font-size: 14px; line-height: 22px; margin: 0 0 16px 0;">
      Bonjour ${userName},
    </p>
    <p style="color: #CBD5E1; font-size: 14px; line-height: 22px; margin: 0 0 24px 0;">
      Nous vous informons que le mot de passe associé à votre compte GayaBTP a été modifié avec succès le <strong>${dateFormatted}</strong>.
    </p>

    <div style="background-color: #0F172A; border-left: 4px solid #2C5F7C; padding: 16px 20px; border-radius: 6px; margin-bottom: 24px;">
      <p style="color: #94A3B8; font-size: 13px; line-height: 20px; margin: 0;">
        Toutes les sessions antérieures ont été révoquées par mesure de protection.
      </p>
    </div>

    <p style="color: #F87171; font-size: 13px; line-height: 20px; margin: 0;">
      Si vous n êtes pas à l initiative de ce changement, veuillez contacter immédiatement l équipe d assistance technique GayaBTP pour sécuriser votre compte.
    </p>
  </div>
${BASE_CONTAINER_END}
`;

/**
 * 3. Gabarit Bienvenue & Intégration
 */
export const getWelcomeEmailHtml = (
  userName: string,
  role: 'particulier' | 'professionnel'
): string => {
  const isPro = role === 'professionnel';
  const roleTitle = isPro ? 'Professionnel du BTP' : 'Particulier';

  const roleContent = isPro
    ? `
      <p style="color: #CBD5E1; font-size: 14px; line-height: 22px; margin: 0 0 16px 0;">
        Votre espace professionnel est désormais prêt. Voici les prochaines étapes pour maximiser vos opportunités :
      </p>
      <ul style="color: #CBD5E1; font-size: 13px; line-height: 24px; padding-left: 20px; margin: 0 0 24px 0;">
        <li>Complétez votre profil avec vos réalisations et compétences clés.</li>
        <li>Soumettez vos agréments officiels pour obtenir le <strong>Badge Professionnel Vérifié</strong>.</li>
        <li>Recevez en temps réel les demandes de devis et opportunités de chantiers.</li>
      </ul>
    `
    : `
      <p style="color: #CBD5E1; font-size: 14px; line-height: 22px; margin: 0 0 16px 0;">
        Bienvenue sur votre plateforme dédiée à la concrétisation sereine de vos projets :
      </p>
      <ul style="color: #CBD5E1; font-size: 13px; line-height: 24px; padding-left: 20px; margin: 0 0 24px 0;">
        <li>Explorez des parcelles foncières et programmes immobiliers audités.</li>
        <li>Consultez les devis et fiches détaillées d artisans et bureaux d études certifiés.</li>
        <li>Activez des alertes personnalisées pour ne manquer aucune opportunité.</li>
      </ul>
    `;

  return `
${BASE_CONTAINER_START('Bienvenue sur GayaBTP')}
  <div style="padding: 36px 28px; text-align: left;">
    <h1 style="color: #FFFFFF; font-size: 20px; margin: 0 0 16px 0; font-weight: 600;">
      Bienvenue sur GayaBTP, ${userName}
    </h1>
    <div style="display: inline-block; padding: 4px 12px; background-color: #2C5F7C; color: #FFFFFF; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 20px;">
      Compte ${roleTitle}
    </div>
    ${roleContent}
    <p style="color: #94A3B8; font-size: 13px; line-height: 20px; margin: 0;">
      Toute l équipe GayaBTP vous souhaite une excellente expérience sur la plateforme.
    </p>
  </div>
${BASE_CONTAINER_END}
  `;
};

/**
 * 4. Gabarit Reçu et Confirmation d'Abonnement B2B
 */
export interface SubscriptionReceiptPayload {
  userName: string;
  planName: string;
  amountFCFA: number;
  reference: string;
  endDateStr: string;
}

export const getSubscriptionReceiptHtml = (data: SubscriptionReceiptPayload): string => `
${BASE_CONTAINER_START('Confirmation de votre abonnement GayaBTP')}
  <div style="padding: 36px 28px; text-align: left;">
    <h1 style="color: #FFFFFF; font-size: 20px; margin: 0 0 12px 0; font-weight: 600;">
      Confirmation d activation de votre abonnement
    </h1>
    <p style="color: #CBD5E1; font-size: 14px; line-height: 22px; margin: 0 0 24px 0;">
      Bonjour ${data.userName}, votre paiement a été validé avec succès. Vos services et privilèges professionnels sont désormais actifs.
    </p>

    <!-- Tableau récapitulatif officiel -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0F172A; border-radius: 8px; border: 1px solid #334155; margin-bottom: 28px;">
      <tr>
        <td style="padding: 14px 18px; color: #94A3B8; font-size: 13px; border-bottom: 1px solid #1E293B;">Formule souscrite :</td>
        <td style="padding: 14px 18px; color: #FFFFFF; font-weight: 700; font-size: 13px; text-align: right; border-bottom: 1px solid #1E293B;">
          Formule ${data.planName}
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 18px; color: #94A3B8; font-size: 13px; border-bottom: 1px solid #1E293B;">Montant réglé :</td>
        <td style="padding: 14px 18px; color: #E99021; font-weight: 700; font-size: 14px; text-align: right; border-bottom: 1px solid #1E293B;">
          ${data.amountFCFA.toLocaleString('fr-FR')} FCFA
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 18px; color: #94A3B8; font-size: 13px; border-bottom: 1px solid #1E293B;">Référence transaction :</td>
        <td style="padding: 14px 18px; color: #CBD5E1; font-family: monospace; font-size: 12px; text-align: right; border-bottom: 1px solid #1E293B;">
          ${data.reference}
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 18px; color: #94A3B8; font-size: 13px;">Date d échéance :</td>
        <td style="padding: 14px 18px; color: #FFFFFF; font-weight: 600; font-size: 13px; text-align: right;">
          ${data.endDateStr}
        </td>
      </tr>
    </table>

    <p style="color: #94A3B8; font-size: 12px; line-height: 19px; margin: 0;">
      Ce document fait office de justificatif numérique de paiement. Vous pouvez retrouver l historique de vos factures dans votre console de gestion GayaBTP.
    </p>
  </div>
${BASE_CONTAINER_END}
`;
