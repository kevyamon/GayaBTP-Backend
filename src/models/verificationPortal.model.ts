import { Schema, model, Document, Model, Types } from 'mongoose';

export interface IVerificationPortal extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  officialEntity: string;
  url: string;
  description: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const verificationPortalSchema = new Schema<IVerificationPortal>(
  {
    name: {
      type: String,
      required: [true, 'Le nom du portail officiel est obligatoire'],
      trim: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    officialEntity: {
      type: String,
      required: [true, 'L entite etatique de rattachement est obligatoire'],
      trim: true,
      maxlength: 150,
    },
    url: {
      type: String,
      required: [true, 'L URL officielle est obligatoire'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'La description du role du service officiel est obligatoire'],
      trim: true,
      maxlength: 1500,
    },
    order: {
      type: Number,
      default: 0,
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

verificationPortalSchema.index({ isActive: 1, order: 1 });

export const VerificationPortal: Model<IVerificationPortal> =
  model<IVerificationPortal>('VerificationPortal', verificationPortalSchema);
