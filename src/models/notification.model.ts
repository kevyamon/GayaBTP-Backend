import { Schema, model, Document, Model, Types } from 'mongoose';

export type NotificationType =
  | 'ALERT_MATCH'
  | 'PAYMENT_VERIFIED'
  | 'PAYMENT_REJECTED'
  | 'CERTIFICATION_APPROVED'
  | 'CERTIFICATION_REJECTED'
  | 'LISTING_MODERATED'
  | 'JOB_MODERATED'
  | 'SYSTEM';

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'ALERT_MATCH',
        'PAYMENT_VERIFIED',
        'PAYMENT_REJECTED',
        'CERTIFICATION_APPROVED',
        'CERTIFICATION_REJECTED',
        'LISTING_MODERATED',
        'JOB_MODERATED',
        'SYSTEM',
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification: Model<INotification> = model<INotification>(
  'Notification',
  notificationSchema
);
