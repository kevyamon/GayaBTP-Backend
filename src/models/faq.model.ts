import { Schema, model, Document, Model, Types } from 'mongoose';

export type FaqCategory =
  | 'general'
  | 'professionnels'
  | 'immobilier'
  | 'foncier'
  | 'paiements'
  | 'certification';

export type FaqStatus = 'published' | 'draft' | 'archived';

export interface IFaq extends Document {
  _id: Types.ObjectId;
  question: string;
  answer: string;
  category: FaqCategory;
  order: number;
  status: FaqStatus;
  createdAt: Date;
  updatedAt: Date;
}

const faqSchema = new Schema<IFaq>(
  {
    question: {
      type: String,
      required: [true, 'La question est obligatoire'],
      trim: true,
      maxlength: 250,
    },
    answer: {
      type: String,
      required: [true, 'La reponse est obligatoire'],
      trim: true,
      maxlength: 3000,
    },
    category: {
      type: String,
      enum: [
        'general',
        'professionnels',
        'immobilier',
        'foncier',
        'paiements',
        'certification',
      ],
      default: 'general',
      index: true,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    status: {
      type: String,
      enum: ['published', 'draft', 'archived'],
      default: 'published',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

faqSchema.index({ status: 1, category: 1, order: 1 });

export const Faq: Model<IFaq> = model<IFaq>('Faq', faqSchema);
