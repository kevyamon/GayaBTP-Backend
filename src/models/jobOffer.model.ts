import { Schema, model, Document, Model, Types } from 'mongoose';

export type JobType = 'stage' | 'emploi';

export type JobStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'rejected'
  | 'expired'
  | 'archived';

export interface IJobOffer extends Document {
  _id: Types.ObjectId;
  authorId: Types.ObjectId;
  type: JobType;
  title: string;
  specialty: string;
  city: string;
  district?: string;
  duration?: string;
  isPaid: boolean;
  remunerationFCFA?: number;
  description: string;
  contactWhatsApp?: string;
  contactEmail?: string;
  status: JobStatus;
  publishedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const jobOfferSchema = new Schema<IJobOffer>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['stage', 'emploi'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Le titre de l offre est obligatoire'],
      trim: true,
      maxlength: 120,
    },
    specialty: {
      type: String,
      required: [true, 'La specialite BTP est obligatoire'],
      trim: true,
      index: true,
    },
    city: {
      type: String,
      required: [true, 'La ville est obligatoire'],
      trim: true,
      index: true,
    },
    district: {
      type: String,
      trim: true,
    },
    duration: {
      type: String,
      trim: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    remunerationFCFA: {
      type: Number,
      min: 0,
    },
    description: {
      type: String,
      required: [true, 'La description est obligatoire'],
      trim: true,
      maxlength: 3000,
    },
    contactWhatsApp: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        'draft',
        'pending_review',
        'published',
        'rejected',
        'expired',
        'archived',
      ],
      default: 'draft',
      index: true,
    },
    publishedAt: {
      type: Date,
      index: true,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

jobOfferSchema.index({ status: 1, type: 1, city: 1 });

export const JobOffer: Model<IJobOffer> = model<IJobOffer>(
  'JobOffer',
  jobOfferSchema
);
