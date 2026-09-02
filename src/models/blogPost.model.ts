import { Schema, model, Document, Model, Types } from 'mongoose';

export type BlogCategory =
  | 'BTP'
  | 'immobilier'
  | 'foncier'
  | 'construction'
  | 'procedures_administratives'
  | 'ACD'
  | 'topographie'
  | 'conseils_pratiques'
  | 'metiers'
  | 'formation'
  | 'emploi';

export type BlogStatus = 'draft' | 'published' | 'archived';

export interface IBlogPost extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category: BlogCategory;
  author: string;
  authorId?: Types.ObjectId;
  status: BlogStatus;
  publishedAt?: Date;
  seoTitle?: string;
  seoDescription?: string;
  tags: string[];
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const blogPostSchema = new Schema<IBlogPost>(
  {
    title: {
      type: String,
      required: [true, 'Le titre de l article est obligatoire'],
      trim: true,
      maxlength: 150,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    excerpt: {
      type: String,
      required: [true, 'Le resume de l article est obligatoire'],
      trim: true,
      maxlength: 400,
    },
    content: {
      type: String,
      required: [true, 'Le contenu complet est obligatoire'],
    },
    coverImage: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'BTP',
        'immobilier',
        'foncier',
        'construction',
        'procedures_administratives',
        'ACD',
        'topographie',
        'conseils_pratiques',
        'metiers',
        'formation',
        'emploi',
      ],
      required: true,
      index: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
      default: 'Equipe GayaBTP',
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    publishedAt: {
      type: Date,
      index: true,
    },
    seoTitle: {
      type: String,
      trim: true,
      maxlength: 70,
    },
    seoDescription: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    viewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

blogPostSchema.index({ status: 1, category: 1, publishedAt: -1 });

export const BlogPost: Model<IBlogPost> = model<IBlogPost>(
  'BlogPost',
  blogPostSchema
);
