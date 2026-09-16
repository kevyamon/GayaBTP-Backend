import { Schema, model, Document, Model, Types } from 'mongoose';

export interface IAdminInvitation extends Document {
  _id: Types.ObjectId;
  code: string;
  createdBy: Types.ObjectId;
  usedBy?: Types.ObjectId;
  targetEmail?: string;
  isUsed: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const adminInvitationSchema = new Schema<IAdminInvitation>(
  {
    code: {
      type: String,
      required: [true, 'Le code d invitation est obligatoire'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'L auteur de l invitation est obligatoire'],
      index: true,
    },
    usedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    targetEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
    },
    isUsed: {
      type: Boolean,
      default: false,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // Valable 24h
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const AdminInvitation: Model<IAdminInvitation> = model<IAdminInvitation>(
  'AdminInvitation',
  adminInvitationSchema
);
