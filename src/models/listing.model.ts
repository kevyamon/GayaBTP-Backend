import { Schema, model, Document, Model, Types } from 'mongoose';

export type PropertyType =
  | 'terrain_nu'
  | 'terrain_villageois'
  | 'maison'
  | 'villa'
  | 'cite'
  | 'appartement'
  | 'immeuble'
  | 'commerce';

export type TitleType =
  | 'ACD'
  | 'CMP'
  | 'arrete_concession'
  | 'lettre_attribution'
  | 'autre';

export type ListingStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'rejected'
  | 'suspended'
  | 'archived';

export interface IListingCoordinates {
  lat: number;
  lng: number;
}

export interface IListing extends Document {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  title: string;
  description: string;
  propertyType: PropertyType;
  priceFCFA: number;
  surfaceM2: number;
  city: string;
  district?: string;
  neighborhood?: string;
  titleType: TitleType;
  coordinates?: IListingCoordinates;
  images: string[];
  status: ListingStatus;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const listingCoordinatesSchema = new Schema<IListingCoordinates>(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const listingSchema = new Schema<IListing>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Le titre de l annonce est obligatoire'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: [true, 'La description est obligatoire'],
      trim: true,
      maxlength: 3000,
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
      required: true,
      index: true,
    },
    priceFCFA: {
      type: Number,
      required: [true, 'Le prix est obligatoire'],
      min: [0, 'Le prix ne peut pas etre negatif'],
      index: true,
    },
    surfaceM2: {
      type: Number,
      required: [true, 'La surface en m2 est obligatoire'],
      min: [1, 'La surface doit etre superieure a 0'],
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
      index: true,
    },
    neighborhood: {
      type: String,
      trim: true,
    },
    titleType: {
      type: String,
      enum: ['ACD', 'CMP', 'arrete_concession', 'lettre_attribution', 'autre'],
      required: true,
      index: true,
    },
    coordinates: listingCoordinatesSchema,
    images: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: [
        'draft',
        'pending_review',
        'published',
        'rejected',
        'suspended',
        'archived',
      ],
      default: 'draft',
      index: true,
    },
    publishedAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index composes pour le filtrage multicritere ultra-rapide
listingSchema.index({ status: 1, city: 1, propertyType: 1, priceFCFA: 1 });
listingSchema.index({ status: 1, surfaceM2: 1, priceFCFA: 1 });

export const Listing: Model<IListing> = model<IListing>('Listing', listingSchema);
