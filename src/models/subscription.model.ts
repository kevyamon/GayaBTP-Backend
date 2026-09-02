import { Schema, model, Document, Model, Types } from 'mongoose';

export type SubscriptionStatus =
  | 'pending'
  | 'active'
  | 'expired'
  | 'cancelled';

export interface ISubscription extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  planId: Types.ObjectId;
  status: SubscriptionStatus;
  startDate?: Date;
  endDate?: Date;
  autoRenew: boolean;
  paymentId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isActive(): boolean;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'expired', 'cancelled'],
      default: 'pending',
      index: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
      index: true,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    },
  },
  {
    timestamps: true,
  }
);

// Methode d'instance verifiant si l'abonnement est actuellement valide
subscriptionSchema.methods.isActive = function (): boolean {
  if (this.status !== 'active') return false;
  if (!this.endDate) return false;
  return new Date() <= new Date(this.endDate);
};

export const Subscription: Model<ISubscription> = model<ISubscription>(
  'Subscription',
  subscriptionSchema
);
