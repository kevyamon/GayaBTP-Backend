import crypto from 'crypto';
import { Types } from 'mongoose';
import { User } from '../models/user.model';
import { AdminInvitation, IAdminInvitation } from '../models/adminInvitation.model';
import { AuditLog } from '../models/auditLog.model';
import { AppError } from '../utils/appError';
import { env } from '../config/env.config';
import {
  generateAccessToken,
  generateRefreshToken,
  AccessTokenPayload,
} from '../utils/token.util';
import {
  AdminLoginInput,
  AdminRegisterInput,
  CreateAdminInviteInput,
} from '../schemas/admin.schema';
import { SafeUser, AuthTokens } from './auth.service';
import { emailService } from './email.service';
import { logger } from '../utils/logger';

export interface AdminAuthResult {
  user: SafeUser;
  tokens: AuthTokens;
}

class AdminAuthService {
  /**
   * Vérifie si un Super Administrateur est déjà enregistré en base de données
   */
  async checkSuperAdminExists(): Promise<boolean> {
    const count = await User.countDocuments({ role: 'admin' });
    return count > 0;
  }

  /**
   * Connexion dédiée au Backoffice Administrateur
   */
  async login(input: AdminLoginInput): Promise<AdminAuthResult> {
    const cleanEmail = input.email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (!user || !(await user.comparePassword(input.password))) {
      throw AppError.unauthorized('Identifiants administrateur invalides.');
    }

    if (user.role !== 'admin') {
      logger.warn('SECURITY', `Tentative d accès admin refusée pour le rôle ${user.role} : ${cleanEmail}`);
      throw AppError.forbidden('Accès réservé exclusivement aux administrateurs.');
    }

    if (user.status !== 'active') {
      throw AppError.forbidden('Votre compte administrateur est suspendu ou inactif.');
    }

    const tokenPayload: AccessTokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    };

    const tokens: AuthTokens = {
      accessToken: generateAccessToken(tokenPayload),
      refreshToken: generateRefreshToken({
        userId: user._id.toString(),
        tokenVersion: user.tokenVersion,
      }),
    };

    logger.info('AUTH', `Connexion au panneau d administration : ${user.email}`);

    return {
      user: user.toJSON() as unknown as SafeUser,
      tokens,
    };
  }

  /**
   * Génération d'un code temporaire à usage unique (valable 24h) pour créer un sous-admin
   */
  async createInvitation(
    adminUserId: string,
    adminEmail: string,
    input: CreateAdminInviteInput
  ): Promise<IAdminInvitation> {
    // Génération d'un code lisible et sécurisé du type GY-AD-676U77
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const code = `GY-AD-${randomSuffix}`;

    const invitation = await AdminInvitation.create({
      code,
      createdBy: new Types.ObjectId(adminUserId),
      targetEmail: input.targetEmail || '',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 heures
    });

    await AuditLog.create({
      actor: { userId: new Types.ObjectId(adminUserId), email: adminEmail, role: 'admin' },
      action: 'admin_generated_invitation_code',
      resource: 'admin_invitation',
      resourceId: invitation._id.toString(),
      metadata: { code, targetEmail: input.targetEmail },
    });

    logger.info('SECURITY', `Code d invitation administrateur généré : ${code} par ${adminEmail}`);

    return invitation;
  }

  /**
   * Inscription d'un administrateur (SuperAdmin via AD_PW ou Sous-Admin via code temporaire)
   */
  async register(input: AdminRegisterInput): Promise<AdminAuthResult> {
    const cleanEmail = input.email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail }).lean();

    if (existing) {
      throw AppError.conflict('Un compte existe déjà avec cette adresse email.');
    }

    let invitationRecord: IAdminInvitation | null = null;

    // 1. Cas Inscription SuperAdmin via clé maître (AD_PW)
    if (input.masterKey) {
      if (input.masterKey !== env.AD_PW) {
        emailService.sendAdminSecurityAlert({
          incidentType: 'Tentative d Inscription SuperAdmin avec Clé Maître Invalide',
          details: `Une tentative d enregistrement avec une fausse clé maître a été interceptée pour l adresse e-mail : ${cleanEmail}.`,
          metadata: { email: cleanEmail, date: new Date().toISOString() },
        }).catch((err) => logger.error('SECURITY', 'Échec alerte admin sécurité', err));

        throw AppError.forbidden('Clé maître SuperAdmin invalide.');
      }

      const superAdminExists = await this.checkSuperAdminExists();
      if (superAdminExists) {
        throw AppError.forbidden(
          'Un compte Super Administrateur est déjà enregistré. Veuillez utiliser un code temporaire pour créer un sous-administrateur.'
        );
      }
    }
    // 2. Cas Inscription Sous-Admin via code temporaire unique (GY-AD-XXXXXX)
    else if (input.temporaryCode) {
      const cleanCode = input.temporaryCode.toUpperCase().trim();
      invitationRecord = await AdminInvitation.findOne({
        code: cleanCode,
        isUsed: false,
        expiresAt: { $gte: new Date() },
      });

      if (!invitationRecord) {
        throw AppError.badRequest('Code d invitation invalide, expiré ou déjà consommé.');
      }

      if (
        invitationRecord.targetEmail &&
        invitationRecord.targetEmail !== cleanEmail
      ) {
        throw AppError.forbidden('Ce code d invitation est réservé à une autre adresse e-mail.');
      }
    } else {
      throw AppError.badRequest('Un code d invitation ou la clé maître SuperAdmin est requis.');
    }

    // Création de l'utilisateur avec rôle administrateur strict
    const user = await User.create({
      name: input.name,
      email: cleanEmail,
      password: input.password,
      phone: input.phone || '',
      role: 'admin',
      status: 'active',
    });

    // Invalidation définitive du code d'invitation (usage unique)
    if (invitationRecord) {
      invitationRecord.isUsed = true;
      invitationRecord.usedBy = user._id;
      await invitationRecord.save();
    }

    await AuditLog.create({
      actor: { userId: user._id, email: user.email, role: 'admin' },
      action: input.masterKey ? 'super_admin_registered_initial' : 'sub_admin_registered_with_code',
      resource: 'user',
      resourceId: user._id.toString(),
      metadata: { codeUsed: invitationRecord?.code || 'MASTER_KEY' },
    });

    const tokenPayload: AccessTokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    };

    const tokens: AuthTokens = {
      accessToken: generateAccessToken(tokenPayload),
      refreshToken: generateRefreshToken({
        userId: user._id.toString(),
        tokenVersion: user.tokenVersion,
      }),
    };

    logger.info('AUTH', `Nouvel administrateur créé : ${user.email} (Type : ${input.masterKey ? 'SuperAdmin' : 'Sous-Admin'})`);

    return {
      user: user.toJSON() as unknown as SafeUser,
      tokens,
    };
  }
}

export const adminAuthService = new AdminAuthService();
