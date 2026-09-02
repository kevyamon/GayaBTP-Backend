import { Schema, model, Document, Model, Types } from 'mongoose';

export type PaymentMethod =
  | 'wave'
  | 'mtn_momo'
  | 'orange_money'
  | 'moov_money'
  | 'virement';

export type PaymentStatus =
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'refunded'
  | 'cancelled';

export interface IPayment extends Document {
  _id: Types.ObjectId;
  reference: string;
  userId: Types.ObjectId;
  subscriptionId?: Types.ObjectId;
  planId: Types.ObjectId;
  amountFCFA: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  proofUrl?: string;
  adminValidatorId?: Types.ObjectId;
  adminNotes?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    amountFCFA: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['wave', 'mtn_momo', 'orange_money', 'moov_money', 'virement'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'refunded', 'cancelled'],
      default: 'pending',
      index: true,
    },
    proofUrl: {
      type: String,
      trim: true,
    },
    adminValidatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ status: 1, createdAt: -1 });

export const Payment: Model<IPayment> = model<IPayment>(
  'Payment',
  paymentSchema
);
