import { Schema, model, Document, Model, Types } from 'mongoose';

export type ProAccountType =
  | 'entreprise'
  | 'cabinet'
  | 'artisan'
  | 'independant'
  | 'bureau_etude';

export type VerificationStatus =
  | 'not_requested'
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'revoked';

export interface IProService {
  _id?: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  priceEstimateFCFA?: number;
  isAvailable: boolean;
}

export interface IProProject {
  _id?: Types.ObjectId;
  title: string;
  description: string;
  location?: string;
  year?: number;
  photos: string[];
}

export interface IProProfile extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  accountType: ProAccountType;
  companyName: string;
  specialties: string[];
  bio: string;
  yearsOfExperience: number;
  city: string;
  district?: string;
  phoneWhatsApp: string;
  email: string;
  services: IProService[];
  projects: IProProject[];
  subscriptionId?: Types.ObjectId;
  verificationStatus: VerificationStatus;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const proServiceSchema = new Schema<IProService>({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 500 },
  category: { type: String, required: true, trim: true },
  priceEstimateFCFA: { type: Number, min: 0 },
  isAvailable: { type: Boolean, default: true },
});

const proProjectSchema = new Schema<IProProject>({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  location: { type: String, trim: true },
  year: { type: Number, min: 1950, max: 2100 },
  photos: [{ type: String, trim: true }],
});

const proProfileSchema = new Schema<IProProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    accountType: {
      type: String,
      enum: ['entreprise', 'cabinet', 'artisan', 'independant', 'bureau_etude'],
      required: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    specialties: [{ type: String, trim: true, index: true }],
    bio: {
      type: String,
      default: '',
      trim: true,
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
      min: 0,
      max: 70,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    district: {
      type: String,
      trim: true,
      index: true,
    },
    phoneWhatsApp: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    services: [proServiceSchema],
    projects: [proProjectSchema],
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
    },
    verificationStatus: {
      type: String,
      enum: [
        'not_requested',
        'pending',
        'under_review',
        'approved',
        'rejected',
        'revoked',
      ],
      default: 'not_requested',
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexation composee pour la recherche rapide dans l'annuaire
proProfileSchema.index({ city: 1, isVerified: -1, isActive: 1 });
proProfileSchema.index({ specialties: 1, city: 1 });

export const ProProfile: Model<IProProfile> = model<IProProfile>(
  'ProProfile',
  proProfileSchema
);
