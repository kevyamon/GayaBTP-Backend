import { User, IUser } from '../models/user.model';
import { ProProfile, IProProfile } from '../models/proProfile.model';
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
import { logger } from '../utils/logger';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: Partial<IUser>;
  proProfile?: Partial<IProProfile> | null;
  tokens: AuthTokens;
}

class AuthService {
  async registerParticulier(input: RegisterParticulierInput): Promise<AuthResult> {
    const existing = await User.findOne({ email: input.email }).lean();
    if (existing) {
      throw AppError.conflict('Un compte existe deja avec cette adresse email.');
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

    logger.info('AUTH', `Inscription d un nouveau particulier : ${user.email}`);

    return { user: user.toJSON(), tokens };
  }

  async registerProfessionnel(input: RegisterProInput): Promise<AuthResult> {
    const existing = await User.findOne({ email: input.email }).lean();
    if (existing) {
      throw AppError.conflict('Un compte existe deja avec cette adresse email.');
    }

    // 1. Creation du compte utilisateur
    const user = await User.create({
      name: input.name,
      email: input.email,
      password: input.password,
      phone: input.phoneWhatsApp,
      role: 'professionnel',
      status: 'active',
    });

    // 2. Creation du profil professionnel associe
    const proProfile = await ProProfile.create({
      userId: user._id,
      accountType: input.accountType,
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

    logger.info('AUTH', `Inscription d un nouveau professionnel : ${user.email} (${input.companyName})`);

    return {
      user: user.toJSON(),
      proProfile: proProfile.toJSON(),
      tokens,
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await User.findOne({ email: input.email }).select('+password');
    if (!user || !(await user.comparePassword(input.password))) {
      throw AppError.unauthorized('Identifiants incorrects (email ou mot de passe invalide).');
    }

    if (user.status === 'suspended') {
      throw AppError.forbidden('Ce compte est temporairement suspendu. Veuillez contacter le support.');
    }

    let proProfile: IProProfile | null = null;
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

    logger.info('AUTH', `Connexion reussie de l utilisateur : ${user.email} [${user.role}]`);

    return {
      user: user.toJSON(),
      proProfile: proProfile ? proProfile.toJSON() : null,
      tokens,
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const payload = verifyRefreshToken(refreshToken);

    const user = await User.findById(payload.userId);
    if (!user || user.status !== 'active') {
      throw AppError.unauthorized('Utilisateur inexistant ou desactive.');
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      throw AppError.unauthorized('Session revoquee. Veuillez vous reconnecter.');
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

  async getMe(userId: string): Promise<{ user: Partial<IUser>; proProfile?: Partial<IProProfile> | null }> {
    const user = await User.findById(userId).lean();
    if (!user) {
      throw AppError.notFound('Utilisateur introuvable.');
    }

    let proProfile: Partial<IProProfile> | null = null;
    if (user.role === 'professionnel') {
      proProfile = await ProProfile.findOne({ userId: user._id }).lean();
    }

    return { user, proProfile };
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
    logger.info('AUTH', `Toutes les sessions ont ete revoquees pour l utilisateur ${userId}`);
  }
}

export const authService = new AuthService();
