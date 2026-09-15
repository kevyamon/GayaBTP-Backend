import { Schema, model, Document, Model, Types } from 'mongoose';

export interface ISystemSetting extends Document {
  _id: Types.ObjectId;
  key: string;
  isFreeModeEnabled: boolean;
  freeModeBannerMessage: string;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const systemSettingSchema = new Schema<ISystemSetting>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'global_config',
      index: true,
    },
    isFreeModeEnabled: {
      type: Boolean,
      required: true,
      default: true,
    },
    freeModeBannerMessage: {
      type: String,
      default: 'Offre de lancement : Toutes les fonctionnalités professionnelles sont actuellement 100% gratuites.',
      trim: true,
      maxlength: 300,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const SystemSetting: Model<ISystemSetting> = model<ISystemSetting>(
  'SystemSetting',
  systemSettingSchema
);
