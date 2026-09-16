import { z } from 'zod';

// 1. Schéma de connexion Administrateur
export const adminLoginSchema = z.object({
  email: z
    .string({ message: 'L email administrateur est obligatoire' })
    .email('Format d email invalide')
    .toLowerCase()
    .trim(),
  password: z
    .string({ message: 'Le mot de passe est obligatoire' })
    .min(1, 'Le mot de passe ne peut pas etre vide'),
});

// 2. Schéma d'inscription Administrateur (SuperAdmin via AD_PW ou Sous-Admin via code temporaire)
export const adminRegisterSchema = z
  .object({
    name: z
      .string({ message: 'Le nom de l administrateur est obligatoire' })
      .min(2, 'Le nom doit comporter au moins 2 caracteres')
      .max(100, 'Le nom ne peut pas depasser 100 caracteres')
      .trim(),
    email: z
      .string({ message: 'L email officiel est obligatoire' })
      .email('Format d email invalide')
      .toLowerCase()
      .trim(),
    password: z
      .string({ message: 'Le mot de passe est obligatoire' })
      .min(8, 'Le mot de passe doit comporter au moins 8 caracteres')
      .max(100, 'Le mot de passe ne peut pas depasser 100 caracteres'),
    phone: z.string().trim().optional(),
    temporaryCode: z.string().trim().optional(),
    masterKey: z.string().trim().optional(),
  })
  .refine((data) => data.temporaryCode || data.masterKey, {
    message:
      'Un code temporaire valide ou la cle maitre SuperAdmin est obligatoire pour creer un compte administrateur.',
    path: ['temporaryCode'],
  });

// 3. Schéma de génération d'un code d'invitation temporaire pour sous-admin
export const createAdminInviteSchema = z.object({
  targetEmail: z.string().email('Format d email invalide').toLowerCase().trim().optional(),
});

// 4. Schéma de modification du statut utilisateur
export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'pending'], {
    message: 'Statut utilisateur invalide (active, suspended, pending)',
  }),
  reason: z.string().max(300, 'Le motif ne peut pas depasser 300 caracteres').optional(),
});

// 5. Schéma de modification du rôle utilisateur
export const updateUserRoleSchema = z.object({
  role: z.enum(['particulier', 'professionnel', 'admin'], {
    message: 'Role utilisateur invalide (particulier, professionnel, admin)',
  }),
  reason: z.string().max(300, 'Le motif ne peut pas depasser 300 caracteres').optional(),
});

// 6. Schéma de bannissement / désactivation
export const banUserSchema = z.object({
  reason: z
    .string({ message: 'Le motif officiel de bannissement est obligatoire' })
    .min(3, 'Le motif doit comporter au moins 3 caracteres')
    .max(500, 'Le motif ne peut pas depasser 500 caracteres')
    .trim(),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type AdminRegisterInput = z.infer<typeof adminRegisterSchema>;
export type CreateAdminInviteInput = z.infer<typeof createAdminInviteSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type BanUserInput = z.infer<typeof banUserSchema>;
