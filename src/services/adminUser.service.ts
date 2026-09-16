import { Types, FilterQuery } from 'mongoose';
import { User, IUser, UserRole, UserStatus } from '../models/user.model';
import { ProProfile } from '../models/proProfile.model';
import { Listing } from '../models/listing.model';
import { Payment } from '../models/payment.model';
import { Subscription } from '../models/subscription.model';
import { VerificationRequest } from '../models/verificationRequest.model';
import { AuditLog } from '../models/auditLog.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export interface User360Details {
  user: IUser;
  proProfile?: unknown;
  listings: unknown[];
  payments: unknown[];
  activeSubscription?: unknown;
  verificationRequests: unknown[];
  auditHistory: unknown[];
}

class AdminUserService {
  /**
   * 1. Liste paginée et filtrée des utilisateurs
   */
  async getUsers(
    page: number = 1,
    limit: number = 20,
    search?: string,
    role?: UserRole,
    status?: UserStatus
  ) {
    const query: FilterQuery<IUser> = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean() as unknown as IUser[],
      User.countDocuments(query),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * 2. Vue 360° approfondie d'un utilisateur (Profil, Pro, Annonces, Paiements, Abonnements)
   */
  async getUserDetails(userId: string): Promise<User360Details> {
    if (!Types.ObjectId.isValid(userId)) {
      throw AppError.badRequest('Identifiant utilisateur invalide.');
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      throw AppError.notFound('Utilisateur introuvable.');
    }

    const [
      proProfile,
      listings,
      payments,
      activeSubscription,
      verificationRequests,
      auditHistory,
    ] = await Promise.all([
      user.role === 'professionnel'
        ? ProProfile.findOne({ userId }).lean()
        : Promise.resolve(null),
      Listing.find({ ownerId: userId }).sort({ createdAt: -1 }).limit(10).lean(),
      Payment.find({ userId }).populate('planId', 'name priceFCFA').sort({ createdAt: -1 }).limit(10).lean(),
      Subscription.findOne({ userId, status: 'active', endDate: { $gte: new Date() } })
        .populate('planId')
        .lean(),
      VerificationRequest.find({ userId }).sort({ createdAt: -1 }).lean(),
      AuditLog.find({ resourceId: userId }).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    return {
      user: user as IUser,
      proProfile,
      listings,
      payments,
      activeSubscription,
      verificationRequests,
      auditHistory,
    };
  }

  /**
   * 3. Modification du statut (actif / suspendu / en attente) avec révocation immédiate de session
   */
  async updateUserStatus(
    userId: string,
    status: UserStatus,
    reason: string | undefined,
    adminUserId: string,
    adminEmail: string
  ): Promise<IUser> {
    if (!Types.ObjectId.isValid(userId)) {
      throw AppError.badRequest('Identifiant utilisateur invalide.');
    }

    // Incrémentation de tokenVersion si suspension pour déconnecter immédiatement l'utilisateur
    const updateData: Record<string, unknown> = { status };
    if (status === 'suspended') {
      updateData.$inc = { tokenVersion: 1 };
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
    if (!user) throw AppError.notFound('Utilisateur introuvable.');

    await AuditLog.create({
      actor: { userId: new Types.ObjectId(adminUserId), email: adminEmail, role: 'admin' },
      action: `admin_updated_user_status_to_${status}`,
      resource: 'user',
      resourceId: userId,
      metadata: { previousStatus: user.status, newStatus: status, reason: reason || 'Non spécifié' },
    });

    logger.info('SECURITY', `Statut utilisateur mis à jour (${userId} -> ${status}) par ${adminEmail}`);

    return user;
  }

  /**
   * 4. Modification du rôle utilisateur avec actualisation de session
   */
  async updateUserRole(
    userId: string,
    role: UserRole,
    reason: string | undefined,
    adminUserId: string,
    adminEmail: string
  ): Promise<IUser> {
    if (!Types.ObjectId.isValid(userId)) {
      throw AppError.badRequest('Identifiant utilisateur invalide.');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { role }, $inc: { tokenVersion: 1 } },
      { new: true }
    );
    if (!user) throw AppError.notFound('Utilisateur introuvable.');

    await AuditLog.create({
      actor: { userId: new Types.ObjectId(adminUserId), email: adminEmail, role: 'admin' },
      action: `admin_updated_user_role_to_${role}`,
      resource: 'user',
      resourceId: userId,
      metadata: { newRole: role, reason: reason || 'Non spécifié' },
    });

    logger.info('SECURITY', `Rôle utilisateur modifié (${userId} -> ${role}) par ${adminEmail}`);

    return user;
  }

  /**
   * 5. Bannissement officiel avec motif immuable consigné
   */
  async banUser(
    userId: string,
    reason: string,
    adminUserId: string,
    adminEmail: string
  ): Promise<IUser> {
    return this.updateUserStatus(userId, 'suspended', reason, adminUserId, adminEmail);
  }
}

export const adminUserService = new AdminUserService();
