import { Schema, model, Document, Model, Types } from 'mongoose';
import { UserRole } from './user.model';

export interface IAuditActor {
  userId?: Types.ObjectId;
  name?: string;
  email?: string;
  role?: UserRole;
  ip?: string;
}

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  actor: IAuditActor;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const auditActorSchema = new Schema<IAuditActor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, trim: true },
    email: { type: String, trim: true },
    role: { type: String },
    ip: { type: String, trim: true },
  },
  { _id: false }
);

const auditLogSchema = new Schema<IAuditLog>(
  {
    actor: {
      type: auditActorSchema,
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    resource: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    resourceId: {
      type: String,
      trim: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.index({ resource: 1, action: 1, createdAt: -1 });

export const AuditLog: Model<IAuditLog> = model<IAuditLog>(
  'AuditLog',
  auditLogSchema
);
