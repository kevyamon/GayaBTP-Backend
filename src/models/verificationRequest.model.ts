import { Schema, model, Document, Model, Types } from 'mongoose';
import { VerificationStatus } from './proProfile.model';

export { VerificationStatus };

export interface IDocumentRecord {
  url: string;
  originalName?: string;
  uploadedAt: Date;
}

export interface IVerificationRequest extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  proProfileId: Types.ObjectId;
  status: VerificationStatus;
  idCardDocument: IDocumentRecord;
  businessLicenseDocument?: IDocumentRecord;
  diplomaDocument?: IDocumentRecord;
  adminReviewerId?: Types.ObjectId;
  adminNotes?: string;
  submittedAt: Date;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const documentRecordSchema = new Schema<IDocumentRecord>(
  {
    url: { type: String, required: true, trim: true },
    originalName: { type: String, trim: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const verificationRequestSchema = new Schema<IVerificationRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    proProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'ProProfile',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        'not_requested',
        'pending',
        'under_review',
        'approved',
        'rejected',
        'revoked',
      ],
      default: 'pending',
      index: true,
    },
    idCardDocument: {
      type: documentRecordSchema,
      required: [true, 'La piece d identite est obligatoire pour la certification'],
    },
    businessLicenseDocument: {
      type: documentRecordSchema,
    },
    diplomaDocument: {
      type: documentRecordSchema,
    },
    adminReviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

verificationRequestSchema.index({ status: 1, submittedAt: -1 });

export const VerificationRequest: Model<IVerificationRequest> =
  model<IVerificationRequest>('VerificationRequest', verificationRequestSchema);
