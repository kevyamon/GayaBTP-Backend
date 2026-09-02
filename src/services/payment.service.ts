import { Types } from 'mongoose';
import { Payment, IPayment, PaymentMethod } from '../models/payment.model';
import { Subscription } from '../models/subscription.model';
import { SubscriptionPlan } from '../models/subscriptionPlan.model';
import { ProProfile } from '../models/proProfile.model';
import { AuditLog } from '../models/auditLog.model';
import { notificationService } from './notification.service';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export interface SubmitPaymentInput {
  planId: string;
  paymentMethod: PaymentMethod;
  amountFCFA: number;
  proofUrl: string;
}

class PaymentService {
  async submitPayment(userId: string, input: SubmitPaymentInput): Promise<IPayment> {
    if (!Types.ObjectId.isValid(input.planId)) {
      throw AppError.badRequest('Identifiant de plan d abonnement invalide.');
    }

    const plan = await SubscriptionPlan.findById(input.planId);
    if (!plan || !plan.isActive) {
      throw AppError.notFound('Plan d abonnement introuvable ou desactive.');
    }

    // Reference professionnelle unique GayaBTP
    const reference = `GAYA-PAY-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const payment = await Payment.create({
      reference,
      userId,
      planId: plan._id,
      amountFCFA: input.amountFCFA,
      paymentMethod: input.paymentMethod,
      proofUrl: input.proofUrl,
      status: 'pending',
    });

    logger.info('PAYMENT', `Nouveau paiement soumis : ${reference} [${input.paymentMethod}] pour ${input.amountFCFA} FCFA`);

    return payment;
  }

  async getUserPayments(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find({ userId })
        .populate('planId', 'name priceFCFA durationDays')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments({ userId }),
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async adminVerifyPayment(
    adminUserId: string,
    adminEmail: string,
    paymentId: string,
    action: 'approve' | 'reject',
    notes?: string
  ): Promise<IPayment> {
    if (!Types.ObjectId.isValid(paymentId)) {
      throw AppError.badRequest('Identifiant de paiement invalide.');
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw AppError.notFound('Paiement introuvable.');
    }

    const plan = await SubscriptionPlan.findById(payment.planId);
    if (!plan) {
      throw AppError.notFound('Plan associe introuvable.');
    }

    if (action === 'approve') {
      payment.status = 'verified';
      payment.adminValidatorId = new Types.ObjectId(adminUserId);
      payment.adminNotes = notes || 'Paiement approuve par l administration';
      payment.verifiedAt = new Date();
      await payment.save();

      // Activation ou renouvellement de l'abonnement
      const startDate = new Date();
      const endDate = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);

      const subscription = await Subscription.create({
        userId: payment.userId,
        planId: plan._id,
        status: 'active',
        startDate,
        endDate,
        paymentId: payment._id,
      });

      // Liaison avec le profil professionnel
      await ProProfile.findOneAndUpdate(
        { userId: payment.userId },
        { $set: { subscriptionId: subscription._id } }
      );

      // Notification utilisateur
      await notificationService.createNotification({
        userId: payment.userId,
        type: 'PAYMENT_VERIFIED',
        title: 'Paiement valide — Abonnement active',
        message: `Votre reglement de ${payment.amountFCFA.toLocaleString('fr-FR')} FCFA pour la formule ${plan.name} a ete valide avec succes. Vos avantages sont desormais actifs jusqu au ${endDate.toLocaleDateString('fr-FR')}.`,
        data: { paymentId: payment._id.toString(), planSlug: plan.slug },
      });

      // Audit Log
      await AuditLog.create({
        actor: { userId: new Types.ObjectId(adminUserId), email: adminEmail, role: 'admin' },
        action: 'admin_approved_payment',
        resource: 'payment',
        resourceId: payment._id.toString(),
        metadata: { amount: payment.amountFCFA, plan: plan.name },
      });
    } else {
      payment.status = 'rejected';
      payment.adminValidatorId = new Types.ObjectId(adminUserId);
      payment.adminNotes = notes || 'Preuve de paiement rejetee.';
      await payment.save();

      await notificationService.createNotification({
        userId: payment.userId,
        type: 'PAYMENT_REJECTED',
        title: 'Paiement non valide',
        message: `Votre preuve de paiement pour la formule ${plan.name} n a pas pu etre validee. Motif : ${notes || 'Justificatif non conforme'}. Veuillez verifier et reessayer.`,
        data: { paymentId: payment._id.toString() },
      });

      await AuditLog.create({
        actor: { userId: new Types.ObjectId(adminUserId), email: adminEmail, role: 'admin' },
        action: 'admin_rejected_payment',
        resource: 'payment',
        resourceId: payment._id.toString(),
        metadata: { reason: notes },
      });
    }

    return payment;
  }
}

export const paymentService = new PaymentService();
