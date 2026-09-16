import { Types } from 'mongoose';
import { Payment, IPayment, PaymentMethod } from '../models/payment.model';
import { Subscription } from '../models/subscription.model';
import { SubscriptionPlan } from '../models/subscriptionPlan.model';
import { ProProfile } from '../models/proProfile.model';
import { User } from '../models/user.model';
import { AuditLog } from '../models/auditLog.model';
import { geniusPayService, GeniusPayWebhookPayload } from './geniusPay.service';
import { notificationService } from './notification.service';
import { socketService } from './socket.service';
import { emailService } from './email.service';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export interface InitiatePaymentInput {
  planSlug: 'starter' | 'pro' | 'premium';
  paymentMethod: PaymentMethod;
}

class PaymentService {
  async initiateSubscriptionPayment(
    userId: string,
    input: InitiatePaymentInput
  ): Promise<{ checkoutUrl: string; reference: string; amountFCFA: number }> {
    const user = await User.findById(userId);
    if (!user) throw AppError.unauthorized('Utilisateur introuvable.');

    const plan = await SubscriptionPlan.findOne({ slug: input.planSlug, isActive: true });
    if (!plan) throw AppError.notFound('Plan d abonnement introuvable.');

    // Calcul du montant recalculé 100% côté serveur
    const amountFCFA = plan.priceFCFA;
    const reference = `GAYA-PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payment = await Payment.create({
      reference,
      userId: user._id,
      planId: plan._id,
      amountFCFA,
      paymentMethod: input.paymentMethod || 'wave',
      status: 'pending',
    });

    const session = await geniusPayService.createPaymentSession({
      reference,
      amountFCFA,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phone,
      description: `Abonnement GayaBTP Formule ${plan.name} (1 mois)`,
      customData: {
        userId: user._id.toString(),
        planId: plan._id.toString(),
        paymentId: payment._id.toString(),
      },
    });

    logger.info('PAYMENT', `Session Genius Pay initiée pour ${reference} (${amountFCFA} FCFA)`);
    return { checkoutUrl: session.checkoutUrl, reference, amountFCFA };
  }

  async processGeniusPayWebhook(payload: GeniusPayWebhookPayload): Promise<boolean> {
    const orderRef = payload.data.metadata?.order_id || payload.data.reference;
    const payment = await Payment.findOne({
      $or: [{ reference: orderRef }, { reference: payload.data.reference }],
    });

    if (!payment) {
      logger.warn('PAYMENT', `Webhook reçu pour référence inconnue : ${orderRef}`);
      return false;
    }

    // Idempotence : Ne pas retraiter un paiement déjà vérifié
    if (payment.status === 'verified') {
      logger.info('PAYMENT', `Paiement ${orderRef} déjà vérifié (idempotent).`);
      return true;
    }

    const isSuccess =
      payload.event === 'payment.success' &&
      (payload.data.status === 'completed' || (payload.data.status as string) === 'successful');

    if (isSuccess) {
      // Sécurité Forteresse : Vérification du montant payé vs attendu
      if (payload.data.amount < payment.amountFCFA) {
        logger.error(
          'PAYMENT',
          `Montant payé invalide pour ${orderRef}: ${payload.data.amount} < ${payment.amountFCFA}`
        );
        payment.status = 'rejected';
        payment.adminNotes = `Fraude potentielle: montant payé (${payload.data.amount}) inférieur au montant requis (${payment.amountFCFA})`;
        await payment.save();
        return false;
      }

      const plan = await SubscriptionPlan.findById(payment.planId);
      if (!plan) return false;

      payment.status = 'verified';
      payment.verifiedAt = new Date();
      await payment.save();

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

      await ProProfile.findOneAndUpdate(
        { userId: payment.userId },
        { $set: { subscriptionId: subscription._id, hasProBadge: plan.hasProBadge } }
      );

      await notificationService.createNotification({
        userId: payment.userId,
        type: 'PAYMENT_VERIFIED',
        title: 'Abonnement activé avec succès',
        message: `Votre abonnement à la formule ${plan.name} est désormais actif jusqu au ${endDate.toLocaleDateString('fr-FR')}.`,
        data: { paymentId: payment._id.toString(), planSlug: plan.slug },
      });

      this.sendSubscriptionReceipt(payment.userId, plan.name, payment.amountFCFA, payment.reference, endDate);

      // Alerte temps réel aux administrateurs
      socketService.sendToAdmins('admin:new_payment', {
        reference: payment.reference,
        amount: payment.amountFCFA,
        planName: plan.name,
      });

      logger.info('PAYMENT', `Paiement ${payment.reference} validé avec succès par webhook Genius Pay.`);
      return true;
    } else {
      payment.status = 'rejected';
      payment.adminNotes = `Paiement non complété. Événement : ${payload.event}, Statut : ${payload.data.status}`;
      await payment.save();
      return true;
    }
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
    if (!payment) throw AppError.notFound('Paiement introuvable.');

    const plan = await SubscriptionPlan.findById(payment.planId);
    if (!plan) throw AppError.notFound('Plan associe introuvable.');

    if (action === 'approve') {
      payment.status = 'verified';
      payment.adminValidatorId = new Types.ObjectId(adminUserId);
      payment.adminNotes = notes || 'Paiement approuve par l administration';
      payment.verifiedAt = new Date();
      await payment.save();

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

      await ProProfile.findOneAndUpdate(
        { userId: payment.userId },
        { $set: { subscriptionId: subscription._id, hasProBadge: plan.hasProBadge } }
      );

      await notificationService.createNotification({
        userId: payment.userId,
        type: 'PAYMENT_VERIFIED',
        title: 'Paiement valide — Abonnement active',
        message: `Votre reglement de ${payment.amountFCFA.toLocaleString('fr-FR')} FCFA pour la formule ${plan.name} a ete valide avec succes. Vos avantages sont desormais actifs jusqu au ${endDate.toLocaleDateString('fr-FR')}.`,
        data: { paymentId: payment._id.toString(), planSlug: plan.slug },
      });

      this.sendSubscriptionReceipt(payment.userId, plan.name, payment.amountFCFA, payment.reference, endDate);

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
        message: `Votre preuve de paiement pour la formule ${plan.name} n a pas pu etre validee. Motif : ${notes || 'Justificatif non conforme'}.`,
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
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async submitPayment(userId: string, input: { planId: string; paymentMethod: PaymentMethod; amountFCFA: number; proofUrl: string }): Promise<IPayment> {
    if (!Types.ObjectId.isValid(input.planId)) throw AppError.badRequest('Identifiant de plan invalide.');
    const plan = await SubscriptionPlan.findById(input.planId);
    if (!plan || !plan.isActive) throw AppError.notFound('Plan introuvable ou inactif.');

    const reference = `GAYA-PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    return Payment.create({
      reference,
      userId,
      planId: plan._id,
      amountFCFA: plan.priceFCFA,
      paymentMethod: input.paymentMethod,
      proofUrl: input.proofUrl,
      status: 'pending',
    });
  }

  private async sendSubscriptionReceipt(
    userId: Types.ObjectId,
    planName: string,
    amountFCFA: number,
    reference: string,
    endDate: Date
  ): Promise<void> {
    try {
      const user = await User.findById(userId).lean();
      if (!user) return;
      const endDateStr = endDate.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      await emailService.sendSubscriptionConfirmationEmail(user.email, {
        userName: user.name,
        planName,
        amountFCFA,
        reference,
        endDateStr,
      });
    } catch (err) {
      logger.error('NOTIFICATION', `Échec d envoi du reçu d abonnement pour ${reference}`, err);
    }
  }
}

export const paymentService = new PaymentService();
