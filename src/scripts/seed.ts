import mongoose from 'mongoose';
import { env } from '../config/env.config';
import { User } from '../models/user.model';
import { SubscriptionPlan } from '../models/subscriptionPlan.model';
import { VerificationPortal } from '../models/verificationPortal.model';
import { Faq } from '../models/faq.model';
import { School } from '../models/school.model';
import { logger } from '../utils/logger';

const seedDatabase = async () => {
  try {
    logger.info('SYSTEM', 'Demarrage du script de peuplement initial (Seed GayaBTP)...');
    await mongoose.connect(env.MONGODB_URI);

    // 1. Initialisation des Plans d'Abonnement officiels
    const plansCount = await SubscriptionPlan.countDocuments();
    if (plansCount === 0) {
      await SubscriptionPlan.create([
        {
          name: 'Starter',
          slug: 'starter',
          priceFCFA: 15000,
          durationDays: 30,
          maxServices: 3,
          maxBioChars: 300,
          maxPhotosPerProject: 2,
          visibility: 'standard',
          hasProBadge: false,
          isFeaturedHome: false,
          isActive: true,
        },
        {
          name: 'Pro',
          slug: 'pro',
          priceFCFA: 35000,
          durationDays: 30,
          maxServices: 8,
          maxBioChars: 800,
          maxPhotosPerProject: 5,
          visibility: 'prioritaire',
          hasProBadge: true,
          isFeaturedHome: false,
          isActive: true,
        },
        {
          name: 'Premium',
          slug: 'premium',
          priceFCFA: 65000,
          durationDays: 30,
          maxServices: -1, // Illimite
          maxBioChars: 2000,
          maxPhotosPerProject: 10,
          visibility: 'maximale',
          hasProBadge: true,
          isFeaturedHome: true,
          isActive: true,
        },
      ]);
      logger.info('SYSTEM', 'Plans d abonnement Starter, Pro et Premium initialises avec succes.');
    }

    // 2. Initialisation des Portails Fonciers Officiels de l'Etat de Cote d'Ivoire
    const portalsCount = await VerificationPortal.countDocuments();
    if (portalsCount === 0) {
      await VerificationPortal.create([
        {
          name: 'IDUFCI — Identifiant Unique Foncier',
          slug: 'idufci',
          officialEntity: 'Ministere de la Construction, du Logement et de l Urbanisme (MCLU)',
          url: 'https://idufci.mclu.gouv.ci',
          description: 'Portail d attribution et de suivi de l Identifiant Unique du Foncier de Cote d Ivoire pour la securisation des parcelles.',
          order: 1,
          isActive: true,
        },
        {
          name: 'Livre Foncier Electronique / DGI',
          slug: 'livre-foncier-dgi',
          officialEntity: 'Direction Generale des Impots (DGI)',
          url: 'https://dgi.gouv.ci',
          description: 'Consultation et verification de la situation fiscale et juridique des titres fonciers enregistres.',
          order: 2,
          isActive: true,
        },
        {
          name: 'Ministere de la Construction (MCLU)',
          slug: 'mclu-officiel',
          officialEntity: 'Gouvernement de Cote d Ivoire',
          url: 'https://construction.gouv.ci',
          description: 'Portail officiel pour les demandes d ACD (Arrete de Concession Definitive) et permis de construire.',
          order: 3,
          isActive: true,
        },
        {
          name: 'Service Public de Cote d Ivoire',
          slug: 'service-public-ci',
          officialEntity: 'Republique de Cote d Ivoire',
          url: 'https://servicepublic.gouv.ci',
          description: 'Portail unifie des demarches administratives et formalites citoyennes ivoiriennes.',
          order: 4,
          isActive: true,
        },
      ]);
      logger.info('SYSTEM', 'Portails fonciers d Etat initialises avec succes.');
    }

    // 3. Initialisation de questions FAQ de base
    const faqCount = await Faq.countDocuments();
    if (faqCount === 0) {
      await Faq.create([
        {
          question: 'Qu est-ce que l ACD et pourquoi est-il indispensable ?',
          answer: 'L Arrete de Concession Definitive (ACD) est le seul titre juridique de propriete fonciere reconnu en zone urbaine en Cote d Ivoire conférant une pleine propriete inattaquable.',
          category: 'foncier',
          order: 1,
          status: 'published',
        },
        {
          question: 'Comment obtenir le Badge Verifie GayaBTP ?',
          answer: 'Rendez-vous sur votre espace professionnel, onglet Certification, et soumettez votre piece d identite ainsi que votre registre de commerce ou agrement technique.',
          category: 'certification',
          order: 2,
          status: 'published',
        },
      ]);
      logger.info('SYSTEM', 'FAQ prechargee avec succes.');
    }

    // 4. Initialisation d'etablissements techniques de reference
    const schoolCount = await School.countDocuments();
    if (schoolCount === 0) {
      await School.create([
        {
          name: 'Lycee Technique d Abidjan (LTA)',
          city: 'Abidjan',
          district: 'Cocody',
          specialties: ['Genie civil', 'Batiment', 'Electrotechnique', 'Topographie'],
          description: 'Etablissement national de reference pour la formation technique secondaire et superieure.',
          status: 'published',
        },
        {
          name: 'INP-HB — Institut National Polytechnique Felix Houphouet-Boigny',
          city: 'Yamoussoukro',
          specialties: ['Genie civil', 'Architecture', 'Travaux Publics', 'Topographie'],
          description: 'Grande ecole d ingenieur de renommee continentale formant les cadres du BTP et des infrastructures.',
          status: 'published',
        },
      ]);
      logger.info('SYSTEM', 'Etablissements techniques de reference initialises.');
    }

    // 5. Initialisation du premier Super Administrateur
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        name: 'Administrateur Principal',
        email: 'admin@gayabtp.ci',
        password: 'AdminPassword2026!', // A modifier apres premiere connexion
        phone: '+2250700000000',
        role: 'admin',
        status: 'active',
      });
      logger.info('SYSTEM', 'Compte Super Administrateur cree : admin@gayabtp.ci (Mot de passe initial : AdminPassword2026!)');
    }

    logger.info('SYSTEM', 'Peuplement initial termine avec succes !');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error('SYSTEM', 'Erreur lors du peuplement de la base', error);
    process.exit(1);
  }
};

seedDatabase();
