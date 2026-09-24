import { z } from 'zod';

// Schéma d'inscription Particulier
export const registerParticulierSchema = z.object({
  name: z
    .string({ message: 'Le nom est obligatoire' })
    .min(2, 'Le nom doit comporter au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),
  email: z
    .string({ message: 'L’e-mail est obligatoire' })
    .email('Format d’e-mail invalide')
    .toLowerCase()
    .trim(),
  password: z
    .string({ message: 'Le mot de passe est obligatoire' })
    .min(8, 'Le mot de passe doit comporter au moins 8 caractères')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères'),
  phone: z.string().trim().optional(),
});

// Schéma d'inscription Professionnel (Tous les métiers BTP / Foncier / Architecture / etc.)
export const registerProSchema = z.object({
  name: z
    .string({ message: 'Le nom du responsable est obligatoire' })
    .min(2, 'Le nom doit comporter au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),
  email: z
    .string({ message: 'L’e-mail professionnel est obligatoire' })
    .email('Format d’e-mail invalide')
    .toLowerCase()
    .trim(),
  password: z
    .string({ message: 'Le mot de passe est obligatoire' })
    .min(8, 'Le mot de passe doit comporter au moins 8 caractères')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères'),
  category: z
    .string({ message: 'La catégorie BTP est obligatoire' })
    .min(2, 'La catégorie doit comporter au moins 2 caractères')
    .trim(),
  accountType: z
    .string()
    .trim()
    .default('entreprise'),
  companyName: z
    .string({ message: 'Le nom de l’entreprise ou raison sociale est obligatoire' })
    .min(2, 'Le nom de l’entreprise doit comporter au moins 2 caractères')
    .max(120, 'Le nom de l’entreprise ne peut pas dépasser 120 caractères')
    .trim(),
  specialties: z
    .array(z.string().trim())
    .min(1, 'Au moins un métier ou spécialité doit être sélectionné'),
  city: z
    .string({ message: 'La ville est obligatoire' })
    .min(2, 'La ville doit comporter au moins 2 caractères')
    .trim(),
  district: z.string().trim().optional(),
  phoneWhatsApp: z
    .string({ message: 'Le numéro WhatsApp est obligatoire' })
    .min(8, 'Le numéro WhatsApp doit comporter au moins 8 chiffres')
    .trim(),
  bio: z.string().max(500, 'La bio ne peut pas dépasser 500 caractères').optional(),
  yearsOfExperience: z.number().min(0).max(70).optional(),
});

// Schéma de connexion
export const loginSchema = z.object({
  email: z
    .string({ message: 'L’e-mail est obligatoire' })
    .email('Format d’e-mail invalide')
    .toLowerCase()
    .trim(),
  password: z
    .string({ message: 'Le mot de passe est obligatoire' })
    .min(1, 'Le mot de passe ne peut pas être vide'),
});

// Schéma de connexion Google OAuth
export const googleAuthSchema = z.object({
  idToken: z
    .string({ message: 'Le jeton Google ID Token est obligatoire' })
    .min(1, 'Le jeton ne peut pas être vide'),
});

// Schéma de demande de réinitialisation de mot de passe (Forgot Password)
export const forgotPasswordSchema = z.object({
  email: z
    .string({ message: 'L’adresse e-mail est obligatoire' })
    .email('Format d’adresse e-mail invalide')
    .toLowerCase()
    .trim(),
});

// Schéma de validation OTP et définition du nouveau mot de passe (Reset Password)
export const resetPasswordSchema = z.object({
  email: z
    .string({ message: 'L’adresse e-mail est obligatoire' })
    .email('Format d’adresse e-mail invalide')
    .toLowerCase()
    .trim(),
  otp: z
    .string({ message: 'Le code de sécurité OTP est obligatoire' })
    .length(6, 'Le code de sécurité doit comporter exactement 6 chiffres')
    .regex(/^\d{6}$/, 'Le code de sécurité doit contenir uniquement des chiffres')
    .trim(),
  newPassword: z
    .string({ message: 'Le nouveau mot de passe est obligatoire' })
    .min(8, 'Le mot de passe doit comporter au moins 8 caractères')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères'),
});

// Schéma de modification du mot de passe (Utilisateur connecté)
export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ message: 'Le mot de passe actuel est obligatoire' })
    .min(1, 'Le mot de passe actuel ne peut pas être vide'),
  newPassword: z
    .string({ message: 'Le nouveau mot de passe est obligatoire' })
    .min(8, 'Le mot de passe doit comporter au moins 8 caractères')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères'),
});

export type RegisterParticulierInput = z.infer<typeof registerParticulierSchema>;
export type RegisterProInput = z.infer<typeof registerProSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
