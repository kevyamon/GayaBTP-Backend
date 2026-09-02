import { Types } from 'mongoose';
import {
  VerificationRequest,
  IVerificationRequest,
  IDocumentRecord,
} from '../models/verificationRequest.model';
import { ProProfile } from '../models/proProfile.model';
import { AuditLog } from '../models/auditLog.model';
import { notificationService } from './notification.service';
import { AppError } from '../utils/appError';

export interface SubmitVerificationInput {
  idCardUrl: string;
  businessLicenseUrl?: string;
  diplomaUrl?: string;
}

class VerificationService {
  async submitRequest(userId: string, input: SubmitVerificationInput): Promise<IVerificationRequest> {
    const proProfile = await ProProfile.findOne({ userId });
    if (!proProfile) {
      throw AppError.notFound('Profil professionnel introuvable.');
    }

    const idCardDocument: IDocumentRecord = {
      url: input.idCardUrl,
      uploadedAt: new Date(),
    };

    const businessLicenseDocument: IDocumentRecord | undefined = input.businessLicenseUrl
      ? { url: input.businessLicenseUrl, uploadedAt: new Date() }
      : undefined;

    const diplomaDocument: IDocumentRecord | undefined = input.diplomaUrl
      ? { url: input.diplomaUrl, uploadedAt: new Date() }
      : undefined;

    const request = await VerificationRequest.create({
      userId,
      proProfileId: proProfile._id,
      idCardDocument,
      businessLicenseDocument,
      diplomaDocument,
      status: 'pending',
      submittedAt: new Date(),
    });

    // Mise a jour du statut dans le profil
    proProfile.verificationStatus = 'pending';
    await proProfile.save();

    return request;
  }

  async getMyRequest(userId: string): Promise<IVerificationRequest | null> {
    return VerificationRequest.findOne({ userId }).sort({ createdAt: -1 });
  }

  async adminReviewRequest(
    adminUserId: string,
    adminEmail: string,
    requestId: string,
    action: 'approve' | 'reject',
    notes?: string
  ): Promise<IVerificationRequest> {
    if (!Types.ObjectId.isValid(requestId)) {
      throw AppError.badRequest('Identifiant de demande invalide.');
    }

    const request = await VerificationRequest.findById(requestId);
    if (!request) {
      throw AppError.notFound('Demande de certification introuvable.');
    }

    const proProfile = await ProProfile.findById(request.proProfileId);
    if (!proProfile) {
      throw AppError.notFound('Profil professionnel associe introuvable.');
    }

    if (action === 'approve') {
      request.status = 'approved';
      request.adminReviewerId = new Types.ObjectId(adminUserId);
      request.adminNotes = notes || 'Certification validee apres audit des pieces.';
      request.reviewedAt = new Date();
      await request.save();

      proProfile.isVerified = true;
      proProfile.verificationStatus = 'approved';
      await proProfile.save();

      await notificationService.createNotification({
        userId: request.userId,
        type: 'CERTIFICATION_APPROVED',
        title: 'Badge Verifie GayaBTP accorde',
        message: 'Felicitations ! Vos pieces justificatives ont ete validees par l administration. Votre badge "Verifie" est desormais affiche sur votre fiche et vos prestations.',
      });

      await AuditLog.create({
        actor: { userId: new Types.ObjectId(adminUserId), email: adminEmail, role: 'admin' },
        action: 'admin_approved_verification',
        resource: 'verification_request',
        resourceId: request._id.toString(),
        metadata: { proProfileId: proProfile._id.toString() },
      });
    } else {
      request.status = 'rejected';
      request.adminReviewerId = new Types.ObjectId(adminUserId);
      request.adminNotes = notes || 'Documents non conformes.';
      request.reviewedAt = new Date();
      await request.save();

      proProfile.isVerified = false;
      proProfile.verificationStatus = 'rejected';
      await proProfile.save();

      await notificationService.createNotification({
        userId: request.userId,
        type: 'CERTIFICATION_REJECTED',
        title: 'Demande de certification non validee',
        message: `Votre demande de certification n a pas pu aboutir. Motif : ${notes || 'Justificatifs illisibles ou non conformes'}. Vous pouvez soumettre de nouvelles pieces.`,
      });

      await AuditLog.create({
        actor: { userId: new Types.ObjectId(adminUserId), email: adminEmail, role: 'admin' },
        action: 'admin_rejected_verification',
        resource: 'verification_request',
        resourceId: request._id.toString(),
        metadata: { reason: notes },
      });
    }

    return request;
  }

  async adminRevokeBadge(
    adminUserId: string,
    adminEmail: string,
    proProfileId: string,
    reason?: string
  ): Promise<void> {
    if (!Types.ObjectId.isValid(proProfileId)) {
      throw AppError.badRequest('Identifiant de profil invalide.');
    }

    const proProfile = await ProProfile.findById(proProfileId);
    if (!proProfile) {
      throw AppError.notFound('Profil professionnel introuvable.');
    }

    proProfile.isVerified = false;
    proProfile.verificationStatus = 'revoked';
    await proProfile.save();

    await AuditLog.create({
      actor: { userId: new Types.ObjectId(adminUserId), email: adminEmail, role: 'admin' },
      action: 'admin_revoked_verification_badge',
      resource: 'pro_profile',
      resourceId: proProfileId,
      metadata: { reason },
    });
  }
}

export const verificationService = new VerificationService();
