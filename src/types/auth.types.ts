import { Types } from 'mongoose';

export interface SafeUser {
  _id: string | Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SafeProProfile {
  _id: string | Types.ObjectId;
  userId: string | Types.ObjectId;
  category: string;
  accountType: string;
  companyName: string;
  specialties: string[];
  bio?: string;
  yearsOfExperience?: number;
  city: string;
  district?: string;
  phoneWhatsApp: string;
  email: string;
  verificationStatus: string;
  isVerified: boolean;
  isActive: boolean;
  services?: unknown[];
  projects?: unknown[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: SafeUser;
  proProfile?: SafeProProfile | null;
  tokens: AuthTokens;
}
