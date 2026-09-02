import { z } from 'zod';

// Schema d'inscription Particulier
export const registerParticulierSchema = z.object({
  name: z
    .string({ message: 'Le nom est obligatoire' })
    .min(2, 'Le nom doit comporter au moins 2 caracteres')
    .max(100, 'Le nom ne peut pas depasser 100 caracteres')
    .trim(),
  email: z
    .string({ message: 'L email est obligatoire' })
    .email('Format d email invalide')
    .toLowerCase()
    .trim(),
  password: z
    .string({ message: 'Le mot de passe est obligatoire' })
    .min(8, 'Le mot de passe doit comporter au moins 8 caracteres')
    .max(100, 'Le mot de passe ne peut pas depasser 100 caracteres'),
  phone: z.string().trim().optional(),
});

// Schema d'inscription Professionnel
export const registerProSchema = z.object({
  name: z
    .string({ message: 'Le nom du responsable est obligatoire' })
    .min(2, 'Le nom doit comporter au moins 2 caracteres')
    .max(100, 'Le nom ne peut pas depasser 100 caracteres')
    .trim(),
  email: z
    .string({ message: 'L email professionnel est obligatoire' })
    .email('Format d email invalide')
    .toLowerCase()
    .trim(),
  password: z
    .string({ message: 'Le mot de passe est obligatoire' })
    .min(8, 'Le mot de passe doit comporter au moins 8 caracteres')
    .max(100, 'Le mot de passe ne peut pas depasser 100 caracteres'),
  accountType: z.enum(
    ['entreprise', 'cabinet', 'artisan', 'independant', 'bureau_etude'],
    { message: 'Type de compte professionnel invalide' }
  ),
  companyName: z
    .string({ message: 'Le nom de l entreprise ou raison sociale est obligatoire' })
    .min(2, 'Le nom de l entreprise doit comporter au moins 2 caracteres')
    .max(120, 'Le nom de l entreprise ne peut pas depasser 120 caracteres')
    .trim(),
  specialties: z
    .array(z.string().trim())
    .min(1, 'Au moins une specialite BTP doit etre renseignee'),
  city: z
    .string({ message: 'La ville est obligatoire' })
    .min(2, 'La ville doit comporter au moins 2 caracteres')
    .trim(),
  district: z.string().trim().optional(),
  phoneWhatsApp: z
    .string({ message: 'Le numero WhatsApp est obligatoire' })
    .min(8, 'Le numero WhatsApp doit comporter au moins 8 chiffres')
    .trim(),
  bio: z.string().max(300, 'La bio initiale ne peut pas depasser 300 caracteres').optional(),
  yearsOfExperience: z.number().min(0).max(70).optional(),
});

// Schema de connexion
export const loginSchema = z.object({
  email: z
    .string({ message: 'L email est obligatoire' })
    .email('Format d email invalide')
    .toLowerCase()
    .trim(),
  password: z
    .string({ message: 'Le mot de passe est obligatoire' })
    .min(1, 'Le mot de passe ne peut pas etre vide'),
});

// Schema de connexion Google OAuth
export const googleAuthSchema = z.object({
  idToken: z
    .string({ message: 'Le jeton Google ID Token est obligatoire' })
    .min(1, 'Le jeton ne peut pas etre vide'),
});

export type RegisterParticulierInput = z.infer<typeof registerParticulierSchema>;
export type RegisterProInput = z.infer<typeof registerProSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
