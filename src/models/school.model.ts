import { Schema, model, Document, Model, Types } from 'mongoose';

export type SchoolStatus = 'published' | 'archived';

export interface ISchool extends Document {
  _id: Types.ObjectId;
  name: string;
  city: string;
  district?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  specialties: string[];
  description?: string;
  status: SchoolStatus;
  createdAt: Date;
  updatedAt: Date;
}

const schoolSchema = new Schema<ISchool>(
  {
    name: {
      type: String,
      required: [true, 'Le nom de l etablissement est obligatoire'],
      unique: true,
      trim: true,
      maxlength: 150,
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
    address: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    specialties: [
      {
        type: String,
        trim: true,
      },
    ],
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ['published', 'archived'],
      default: 'published',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

schoolSchema.index({ status: 1, city: 1, specialties: 1 });

export const School: Model<ISchool> = model<ISchool>('School', schoolSchema);
