import { Schema, model, Document, Model } from 'mongoose';

export type PlanSlug = 'starter' | 'pro' | 'premium';
export type PlanVisibility = 'standard' | 'prioritaire' | 'maximale';

export interface ISubscriptionPlan extends Document {
  name: string;
  slug: PlanSlug;
  priceFCFA: number;
  durationDays: number;
  maxServices: number; // -1 pour illimite
  maxBioChars: number;
  maxPhotosPerProject: number;
  visibility: PlanVisibility;
  hasProBadge: boolean;
  isFeaturedHome: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    name: {
      type: String,
      required: [true, 'Le nom du plan est obligatoire'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      enum: ['starter', 'pro', 'premium'],
      required: true,
      unique: true,
      index: true,
    },
    priceFCFA: {
      type: Number,
      required: true,
      min: [0, 'Le prix ne peut pas etre negatif'],
    },
    durationDays: {
      type: Number,
      default: 30,
      min: 1,
    },
    maxServices: {
      type: Number,
      required: true,
      default: 3, // -1 correspond a illimite
    },
    maxBioChars: {
      type: Number,
      required: true,
      default: 300,
    },
    maxPhotosPerProject: {
      type: Number,
      required: true,
      default: 2,
    },
    visibility: {
      type: String,
      enum: ['standard', 'prioritaire', 'maximale'],
      default: 'standard',
    },
    hasProBadge: {
      type: Boolean,
      default: false,
    },
    isFeaturedHome: {
      type: Boolean,
      default: false,
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

export const SubscriptionPlan: Model<ISubscriptionPlan> =
  model<ISubscriptionPlan>('SubscriptionPlan', subscriptionPlanSchema);
