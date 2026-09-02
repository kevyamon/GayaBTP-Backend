import { Types, FilterQuery } from 'mongoose';
import { User, IUser, UserRole, UserStatus } from '../models/user.model';
import { ProProfile } from '../models/proProfile.model';
import { Listing, IListing, ListingStatus } from '../models/listing.model';
import { Payment, IPayment, PaymentStatus } from '../models/payment.model';
import { VerificationRequest, IVerificationRequest, VerificationStatus } from '../models/verificationRequest.model';
import { Subscription } from '../models/subscription.model';
import { Alert } from '../models/alert.model';
import { JobOffer } from '../models/jobOffer.model';
import { AuditLog, IAuditLog } from '../models/auditLog.model';
import { AppError } from '../utils/appError';

export interface DashboardStats {
  totalUsers: number;
  totalPros: number;
  totalListings: number;
  pendingVerifications: number;
  pendingPayments: number;
  activeSubscriptions: number;
  totalRevenueFCFA: number;
  activeAlerts: number;
  totalJobs: number;
}

class AdminService {
  async getDashboardStats(): Promise<DashboardStats> {
    const [
      totalUsers,
      totalPros,
      totalListings,
      pendingVerifications,
      pendingPayments,
      activeSubscriptions,
      activeAlerts,
      totalJobs,
      verifiedPayments,
    ] = await Promise.all([
      User.countDocuments(),
      ProProfile.countDocuments(),
      Listing.countDocuments({ status: { $ne: 'archived' } }),
      VerificationRequest.countDocuments({ status: 'pending' }),
      Payment.countDocuments({ status: 'pending' }),
      Subscription.countDocuments({ status: 'active', endDate: { $gte: new Date() } }),
      Alert.countDocuments({ isActive: true }),
      JobOffer.countDocuments({ status: 'published' }),
      Payment.aggregate([
        { $match: { status: 'verified' } },
        { $group: { _id: null, total: { $sum: '$amountFCFA' } } },
      ]),
    ]);

    const totalRevenueFCFA = verifiedPayments.length > 0 ? verifiedPayments[0].total : 0;

    return {
      totalUsers,
      totalPros,
      totalListings,
      pendingVerifications,
      pendingPayments,
      activeSubscriptions,
      totalRevenueFCFA,
      activeAlerts,
      totalJobs,
    };
  }

  async getUsers(page: number = 1, limit: number = 20, search?: string, role?: UserRole, status?: UserStatus) {
    const query: FilterQuery<IUser> = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);

    return { users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  }

  async updateUserStatus(userId: string, status: UserStatus, adminUserId: string, adminEmail: string) {
    if (!Types.ObjectId.isValid(userId)) throw AppError.badRequest('Identifiant utilisateur invalide.');
    const user = await User.findByIdAndUpdate(userId, { $set: { status } }, { new: true });
    if (!user) throw AppError.notFound('Utilisateur introuvable.');

    await AuditLog.create({
      actor: { userId: new Types.ObjectId(adminUserId), email: adminEmail, role: 'admin' },
      action: `admin_updated_user_status_to_${status}`,
      resource: 'user',
      resourceId: userId,
    });
    return user;
  }

  async updateUserRole(userId: string, role: UserRole, adminUserId: string, adminEmail: string) {
    if (!Types.ObjectId.isValid(userId)) throw AppError.badRequest('Identifiant utilisateur invalide.');
    const user = await User.findByIdAndUpdate(userId, { $set: { role } }, { new: true });
    if (!user) throw AppError.notFound('Utilisateur introuvable.');

    await AuditLog.create({
      actor: { userId: new Types.ObjectId(adminUserId), email: adminEmail, role: 'admin' },
      action: `admin_updated_user_role_to_${role}`,
      resource: 'user',
      resourceId: userId,
    });
    return user;
  }

  async getListings(page: number = 1, limit: number = 20, status?: ListingStatus) {
    const query: FilterQuery<IListing> = status ? { status } : {};
    const skip = (page - 1) * limit;
    const [listings, total] = await Promise.all([
      Listing.find(query).populate('ownerId', 'name email phone').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Listing.countDocuments(query),
    ]);
    return { listings, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  }

  async moderateListing(listingId: string, status: ListingStatus, adminUserId: string, adminEmail: string) {
    if (!Types.ObjectId.isValid(listingId)) throw AppError.badRequest('Identifiant d annonce invalide.');
    const listing = await Listing.findByIdAndUpdate(listingId, { $set: { status } }, { new: true });
    if (!listing) throw AppError.notFound('Annonce introuvable.');

    await AuditLog.create({
      actor: { userId: new Types.ObjectId(adminUserId), email: adminEmail, role: 'admin' },
      action: `admin_moderated_listing_to_${status}`,
      resource: 'listing',
      resourceId: listingId,
    });
    return listing;
  }

  async getPayments(page: number = 1, limit: number = 20, status?: PaymentStatus) {
    const query: FilterQuery<IPayment> = status ? { status } : {};
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('userId', 'name email phone')
        .populate('planId', 'name priceFCFA')
        .populate('adminValidatorId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(query),
    ]);
    return { payments, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  }

  async getVerifications(page: number = 1, limit: number = 20, status?: VerificationStatus) {
    const query: FilterQuery<IVerificationRequest> = status ? { status } : {};
    const skip = (page - 1) * limit;
    const [verifications, total] = await Promise.all([
      VerificationRequest.find(query)
        .populate('userId', 'name email phone')
        .populate('proProfileId', 'companyName accountType specialties')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      VerificationRequest.countDocuments(query),
    ]);
    return { verifications, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  }

  async getAuditLogs(page: number = 1, limit: number = 30) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean() as unknown as IAuditLog[],
      AuditLog.countDocuments(),
    ]);
    return { logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  }
}

export const adminService = new AdminService();
