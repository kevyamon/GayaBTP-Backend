import { Schema, model, Document, Model, Types } from 'mongoose';
import { PropertyType, TitleType } from './listing.model';

export interface IAlert extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  propertyType?: PropertyType;
  city?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  minSurface?: number;
  titleType?: TitleType;
  isActive: boolean;
  lastTriggeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const alertSchema = new Schema<IAlert>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Le nom de l alerte est obligatoire'],
      trim: true,
      maxlength: 100,
    },
    propertyType: {
      type: String,
      enum: [
        'terrain_nu',
        'terrain_villageois',
        'maison',
        'villa',
        'cite',
        'appartement',
        'immeuble',
        'commerce',
      ],
      index: true,
    },
    city: {
      type: String,
      trim: true,
      index: true,
    },
    district: {
      type: String,
      trim: true,
    },
    minPrice: {
      type: Number,
      min: 0,
    },
    maxPrice: {
      type: Number,
      min: 0,
    },
    minSurface: {
      type: Number,
      min: 0,
    },
    titleType: {
      type: String,
      enum: ['ACD', 'CMP', 'arrete_concession', 'lettre_attribution', 'autre'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastTriggeredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexation pour le moteur de matching d'alertes en arriere-plan
alertSchema.index({ isActive: 1, city: 1, propertyType: 1 });

export const Alert: Model<IAlert> = model<IAlert>('Alert', alertSchema);
