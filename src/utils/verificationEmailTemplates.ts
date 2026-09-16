/**
 * Gabarits HTML institutionnels pour l'audit des certifications BTP et le moteur d'alertes foncières.
 * Charte graphique GayaBTP : zéro emoji, typographie soignée, styles épurés.
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
              Pôle Régulation & Certification Professionnelle
            </p>
          </div>
`;

const BASE_CONTAINER_END = `
          <!-- Pied de page officiel -->
          <div style="background-color: #0F172A; padding: 20px 24px; text-align: center; border-top: 1px solid #334155;">
            <p style="color: #64748B; font-size: 11px; margin: 0; line-height: 18px;">
              GayaBTP — République de Côte d Ivoire.<br>
              Ceci est un message transactionnel sécurisé émis par le pôle d audit GayaBTP.
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
 * 1. Accusé de réception du dépôt de dossier de certification
 */
export const getVerificationSubmittedHtml = (userName: string, companyName: string): string => `
${BASE_CONTAINER_START('Dossier de certification reçu')}
  <div style="padding: 36px 28px; text-align: left;">
    <h1 style="color: #FFFFFF; font-size: 19px; margin: 0 0 16px 0; font-weight: 600;">
      Dossier de certification en cours d instruction
    </h1>
    <p style="color: #CBD5E1; font-size: 14px; line-height: 22px; margin: 0 0 16px 0;">
      Bonjour ${userName},
    </p>
    <p style="color: #CBD5E1; font-size: 14px; line-height: 22px; margin: 0 0 20px 0;">
      Nous vous confirmons la bonne réception des pièces justificatives soumises pour votre structure <strong>${companyName}</strong>.
    </p>

    <div style="background-color: #0F172A; border-left: 4px solid #E99021; padding: 16px 20px; border-radius: 6px; margin-bottom: 24px;">
      <p style="color: #CBD5E1; font-size: 13px; line-height: 20px; margin: 0;">
        Nos équipes de conformité procèdent actuellement à la vérification de vos pièces officielles (identité, registre de commerce, arrêtés ministériels ou diplômes).
      </p>
    </div>

    <p style="color: #94A3B8; font-size: 13px; line-height: 20px; margin: 0;">
      Vous recevrez une notification officielle par courriel dès que la décision d audit sera rendue (délai moyen constaté : 24 à 48 heures ouvrées).
    </p>
  </div>
${BASE_CONTAINER_END}
`;

/**
 * 2. Félicitations — Attribution du Badge Professionnel Vérifié
 */
export const getVerificationApprovedHtml = (userName: string, companyName: string): string => `
${BASE_CONTAINER_START('Badge Vérifié GayaBTP attribué')}
  <div style="padding: 36px 28px; text-align: left;">
    <h1 style="color: #FFFFFF; font-size: 19px; margin: 0 0 16px 0; font-weight: 600;">
      Félicitations ! Votre structure est officiellement vérifiée
    </h1>
    <p style="color: #CBD5E1; font-size: 14px; line-height: 22px; margin: 0 0 16px 0;">
      Bonjour ${userName},
    </p>
    <p style="color: #CBD5E1; font-size: 14px; line-height: 22px; margin: 0 0 24px 0;">
      L audit de conformité de vos pièces administratives pour <strong>${companyName}</strong> a été validé avec succès par l administration GayaBTP.
    </p>

    <!-- Bloc badge actif -->
    <div style="background-color: #0F172A; border: 1px solid #10B981; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; padding: 6px 16px; background-color: #064E3B; color: #34D399; font-size: 13px; font-weight: 700; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
        Badge Professionnel Vérifié Actif
      </span>
      <p style="color: #CBD5E1; font-size: 13px; margin: 0; line-height: 20px;">
        Ce label officiel est désormais visible sur votre vitrine, renforçant immédiatement la confiance des maîtres d ouvrage et investisseurs.
      </p>
    </div>

    <p style="color: #94A3B8; font-size: 13px; line-height: 20px; margin: 0;">
      Vos prestations bénéficient dorénavant d une visibilité prioritaire dans l annuaire général des spécialistes du BTP.
    </p>
  </div>
${BASE_CONTAINER_END}
`;

/**
 * 3. Rejet motivé ou demande de pièces complémentaires
 */
export const getVerificationRejectedHtml = (
  userName: string,
  companyName: string,
  reason?: string
): string => `
${BASE_CONTAINER_START('Mise à niveau de votre dossier de certification')}
  <div style="padding: 36px 28px; text-align: left;">
    <h1 style="color: #FFFFFF; font-size: 19px; margin: 0 0 16px 0; font-weight: 600;">
      Information relative à votre demande de certification
    </h1>
    <p style="color: #CBD5E1; font-size: 14px; line-height: 22px; margin: 0 0 16px 0;">
      Bonjour ${userName},
    </p>
    <p style="color: #CBD5E1; font-size: 14px; line-height: 22px; margin: 0 0 20px 0;">
      L examen de votre dossier pour <strong>${companyName}</strong> n a pas permis de valider l attribution du Badge Vérifié dans l état actuel des pièces.
    </p>

    <!-- Motif d'audit consigné -->
    <div style="background-color: #0F172A; border-left: 4px solid #EF4444; padding: 18px 20px; border-radius: 6px; margin-bottom: 24px;">
      <p style="color: #FCA5A5; font-size: 12px; font-weight: 700; text-transform: uppercase; margin: 0 0 6px 0;">
        Motif consigné par l auditeur :
      </p>
      <p style="color: #FFFFFF; font-size: 13px; line-height: 20px; margin: 0;">
        ${reason || 'Justificatifs illisibles, incomplets ou non conformes aux agréments requis.'}
      </p>
    </div>

    <p style="color: #CBD5E1; font-size: 13px; line-height: 20px; margin: 0 0 16px 0;">
      Vous avez la possibilité de téléverser de nouveaux documents conformes directement depuis votre espace professionnel.
    </p>
  </div>
${BASE_CONTAINER_END}
`;

/**
 * 4. Alerte Nouveau Bien / Terrain correspondant aux critères d'un acquéreur
 */
export interface ListingAlertMatchPayload {
  userName: string;
  alertName: string;
  listingTitle: string;
  city: string;
  district?: string;
  propertyType: string;
  priceFCFA: number;
  surfaceM2?: number;
  listingId: string;
}

export const getListingAlertMatchHtml = (data: ListingAlertMatchPayload): string => `
${BASE_CONTAINER_START('Nouvelle opportunité immobilière')}
  <div style="padding: 36px 28px; text-align: left;">
    <h1 style="color: #FFFFFF; font-size: 19px; margin: 0 0 12px 0; font-weight: 600;">
      Nouvelle opportunité correspondant à votre alerte
    </h1>
    <p style="color: #CBD5E1; font-size: 14px; line-height: 22px; margin: 0 0 20px 0;">
      Bonjour ${data.userName}, une nouvelle annonce correspondant à vos critères d alerte <strong>« ${data.alertName} »</strong> vient d être publiée :
    </p>

    <div style="background-color: #0F172A; border: 1px solid #334155; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <h3 style="color: #FFFFFF; font-size: 16px; margin: 0 0 10px 0;">${data.listingTitle}</h3>
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 6px 0; color: #94A3B8; font-size: 13px;">Localisation :</td>
          <td style="padding: 6px 0; color: #CBD5E1; font-weight: 600; font-size: 13px; text-align: right;">
            ${data.city}${data.district ? `, ${data.district}` : ''}
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94A3B8; font-size: 13px;">Prix :</td>
          <td style="padding: 6px 0; color: #E99021; font-weight: 700; font-size: 14px; text-align: right;">
            ${data.priceFCFA.toLocaleString('fr-FR')} FCFA
          </td>
        </tr>
        ${
          data.surfaceM2
            ? `
        <tr>
          <td style="padding: 6px 0; color: #94A3B8; font-size: 13px;">Superficie :</td>
          <td style="padding: 6px 0; color: #CBD5E1; font-size: 13px; text-align: right;">
            ${data.surfaceM2} m²
          </td>
        </tr>
        `
            : ''
        }
      </table>
    </div>

    <p style="color: #94A3B8; font-size: 12px; line-height: 19px; margin: 0;">
      Connectez-vous sur GayaBTP pour consulter le dossier complet et entrer en contact sécurisé avec le dépositaire.
    </p>
  </div>
${BASE_CONTAINER_END}
`;
