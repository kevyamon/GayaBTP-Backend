import axios from 'axios';
import { User } from '../models/user.model';
import { ProProfile } from '../models/proProfile.model';
import { AppError } from '../utils/appError';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  AccessTokenPayload,
} from '../utils/token.util';
import {
  RegisterParticulierInput,
  RegisterProInput,
  LoginInput,
} from '../schemas/auth.schema';
import { SafeUser, SafeProProfile, AuthTokens, AuthResult } from '../types/auth.types';
import { emailService } from './email.service';
import { logger } from '../utils/logger';

export type { SafeUser, SafeProProfile, AuthTokens, AuthResult };

class AuthService {
  async registerParticulier(input: RegisterParticulierInput): Promise<AuthResult> {
    const existing = await User.findOne({ email: input.email }).lean();
    if (existing) {
      throw AppError.conflict('Un compte existe déjà avec cette adresse e-mail.');
    }

    const user = await User.create({
      name: input.name,
      email: input.email,
      password: input.password,
      phone: input.phone || '',
      role: 'particulier',
      status: 'active',
    });

    const tokenPayload: AccessTokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    };

    const tokens: AuthTokens = {
      accessToken: generateAccessToken(tokenPayload),
      refreshToken: generateRefreshToken({
        userId: user._id.toString(),
        tokenVersion: user.tokenVersion,
      }),
    };

    logger.info('AUTH', `Inscription particulier : ${user.email}`);
    emailService.sendWelcomeEmail(user.email, user.name, 'particulier').catch((err) =>
      logger.error('NOTIFICATION', `Échec e-mail bienvenue ${user.email}`, err)
    );

    return { user: user.toJSON() as unknown as SafeUser, tokens };
  }

  async registerProfessionnel(input: RegisterProInput): Promise<AuthResult> {
    const existing = await User.findOne({ email: input.email }).lean();
    if (existing) {
      throw AppError.conflict('Un compte existe déjà avec cette adresse e-mail.');
    }

    const user = await User.create({
      name: input.name,
      email: input.email,
      password: input.password,
      phone: input.phoneWhatsApp,
      role: 'professionnel',
      status: 'active',
    });

    const proProfile = await ProProfile.create({
      userId: user._id,
      category: input.category,
      accountType: input.accountType || 'entreprise',
      companyName: input.companyName,
      specialties: input.specialties,
      bio: input.bio || '',
      yearsOfExperience: input.yearsOfExperience || 0,
      city: input.city,
      district: input.district,
      phoneWhatsApp: input.phoneWhatsApp,
      email: input.email,
      verificationStatus: 'not_requested',
      isVerified: false,
      isActive: true,
      services: [],
      projects: [],
    });

    const tokenPayload: AccessTokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    };

    const tokens: AuthTokens = {
      accessToken: generateAccessToken(tokenPayload),
      refreshToken: generateRefreshToken({
        userId: user._id.toString(),
        tokenVersion: user.tokenVersion,
      }),
    };

    logger.info('AUTH', `Inscription pro (${input.category}) : ${user.email}`);
    emailService.sendWelcomeEmail(user.email, user.name, 'professionnel').catch((err) =>
      logger.error('NOTIFICATION', `Échec e-mail bienvenue pro ${user.email}`, err)
    );

    return {
      user: user.toJSON() as unknown as SafeUser,
      proProfile: proProfile.toJSON() as unknown as SafeProProfile,
      tokens,
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await User.findOne({ email: input.email }).select('+password');
    if (!user || !(await user.comparePassword(input.password))) {
      throw AppError.unauthorized('Identifiants incorrects (e-mail ou mot de passe invalide).');
    }

    if (user.status === 'suspended') {
      throw AppError.forbidden('Ce compte est suspendu. Veuillez contacter le support.');
    }

    let proProfile = null;
    if (user.role === 'professionnel') {
      proProfile = await ProProfile.findOne({ userId: user._id });
    }

    const tokenPayload: AccessTokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    };

    const tokens: AuthTokens = {
      accessToken: generateAccessToken(tokenPayload),
      refreshToken: generateRefreshToken({
        userId: user._id.toString(),
        tokenVersion: user.tokenVersion,
      }),
    };

    return {
      user: user.toJSON() as unknown as SafeUser,
      proProfile: proProfile ? (proProfile.toJSON() as unknown as SafeProProfile) : null,
      tokens,
    };
  }

  async loginWithGoogle(idToken: string): Promise<AuthResult> {
    let payload: { email?: string; email_verified?: string | boolean; name?: string; picture?: string };
    try {
      const googleRes = await axios.get(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
      );
      payload = googleRes.data;
    } catch {
      throw AppError.unauthorized('Jeton de sécurité Google invalide ou expiré.');
    }

    if (!payload?.email || (payload.email_verified !== 'true' && payload.email_verified !== true)) {
      throw AppError.unauthorized('Adresse e-mail Google non vérifiée.');
    }

    const email = payload.email.toLowerCase().trim();
    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-12) + '!Gaya2026';
      user = await User.create({
        name: payload.name || email.split('@')[0],
        email,
        password: randomPassword,
        avatar: payload.picture || '',
        role: 'particulier',
        status: 'active',
      });
      logger.info('AUTH', `Compte créé via Google OAuth : ${email}`);
    } else if (user.status === 'suspended') {
      throw AppError.forbidden('Ce compte est suspendu. Veuillez contacter le support.');
    } else if (payload.picture && !user.avatar) {
      user.avatar = payload.picture;
      await user.save();
    }

    let proProfile = null;
    if (user.role === 'professionnel') {
      proProfile = await ProProfile.findOne({ userId: user._id });
    }

    const tokenPayload: AccessTokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    };

    const tokens: AuthTokens = {
      accessToken: generateAccessToken(tokenPayload),
      refreshToken: generateRefreshToken({
        userId: user._id.toString(),
        tokenVersion: user.tokenVersion,
      }),
    };

    return {
      user: user.toJSON() as unknown as SafeUser,
      proProfile: proProfile ? (proProfile.toJSON() as unknown as SafeProProfile) : null,
      tokens,
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.userId);
    if (!user || user.status !== 'active') {
      throw AppError.unauthorized('Utilisateur inexistant ou désactivé.');
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      throw AppError.unauthorized('Session révoquée. Veuillez vous reconnecter.');
    }

    const tokenPayload: AccessTokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    };

    return {
      accessToken: generateAccessToken(tokenPayload),
      refreshToken: generateRefreshToken({
        userId: user._id.toString(),
        tokenVersion: user.tokenVersion,
      }),
    };
  }

  async getMe(userId: string): Promise<{ user: SafeUser; proProfile?: SafeProProfile | null }> {
    const user = await User.findById(userId).lean();
    if (!user) {
      throw AppError.notFound('Utilisateur introuvable.');
    }

    let proProfile: SafeProProfile | null = null;
    if (user.role === 'professionnel') {
      proProfile = (await ProProfile.findOne({ userId: user._id }).lean()) as unknown as SafeProProfile;
    }

    return { user: user as unknown as SafeUser, proProfile };
  }

  async updateMe(
    userId: string,
    input: Record<string, unknown>
  ): Promise<{ user: SafeUser; proProfile?: SafeProProfile | null }> {
    const userUpdates: Record<string, unknown> = {};
    const proUpdates: Record<string, unknown> = {};

    ['name', 'phone', 'avatar', 'coverImage', 'city', 'bio'].forEach((k) => {
      if (input[k] !== undefined) userUpdates[k] = input[k];
    });

    ['companyName', 'specialties', 'phoneWhatsApp', 'bio', 'city', 'district', 'yearsOfExperience'].forEach((k) => {
      if (input[k] !== undefined) proUpdates[k] = input[k];
    });

    const updatedUser = await User.findByIdAndUpdate(userId, userUpdates, { new: true }).lean();
    if (!updatedUser) throw AppError.notFound('Utilisateur introuvable.');

    let updatedPro: SafeProProfile | null = null;
    if (updatedUser.role === 'professionnel') {
      updatedPro = (await ProProfile.findOneAndUpdate(
        { userId: updatedUser._id },
        proUpdates,
        { new: true }
      ).lean()) as unknown as SafeProProfile;
    }

    return { user: updatedUser as unknown as SafeUser, proProfile: updatedPro };
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
    logger.info('AUTH', `Sessions révoquées pour ${userId}`);
  }
}

export const authService = new AuthService();
