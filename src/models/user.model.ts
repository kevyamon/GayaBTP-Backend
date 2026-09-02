import { Schema, model, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'particulier' | 'professionnel' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'pending';

export interface IUser extends Document {
  _id: Schema.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  googleId?: string;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Le nom est obligatoire'],
      trim: true,
      minlength: [2, 'Le nom doit comporter au moins 2 caracteres'],
      maxlength: [100, 'Le nom ne peut pas depasser 100 caracteres'],
    },
    email: {
      type: String,
      required: [true, 'L email est obligatoire'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Veuillez fournir une adresse email valide',
      ],
    },
    password: {
      type: String,
      select: false, // Le hash ne sort JAMAIS des requetes standards
      minlength: [8, 'Le mot de passe doit comporter au moins 8 caracteres'],
    },
    avatar: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: ['particulier', 'professionnel', 'admin'],
      default: 'particulier',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'pending'],
      default: 'active',
      index: true,
    },
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Hashage automatique du mot de passe avec 12 rounds de salage
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Methode d'instance de comparaison securisee du mot de passe
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User: Model<IUser> = model<IUser>('User', userSchema);
