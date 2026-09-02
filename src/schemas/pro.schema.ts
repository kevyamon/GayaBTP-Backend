import { z } from 'zod';

export const updateProProfileSchema = z.object({
  companyName: z
    .string()
    .min(2, 'Le nom de l entreprise doit comporter au moins 2 caracteres')
    .max(120)
    .trim()
    .optional(),
  bio: z.string().max(2000).trim().optional(),
  specialties: z.array(z.string().trim()).min(1).optional(),
  city: z.string().min(2).trim().optional(),
  district: z.string().trim().optional(),
  phoneWhatsApp: z.string().min(8).trim().optional(),
  email: z.string().email().toLowerCase().trim().optional(),
  yearsOfExperience: z.number().min(0).max(70).optional(),
});

export const addServiceSchema = z.object({
  title: z
    .string({ message: 'Le titre du service est obligatoire' })
    .min(3, 'Le titre doit comporter au moins 3 caracteres')
    .max(120)
    .trim(),
  description: z
    .string({ message: 'La description du service est obligatoire' })
    .min(10, 'La description doit comporter au moins 10 caracteres')
    .max(500)
    .trim(),
  category: z
    .string({ message: 'La categorie du service est obligatoire' })
    .trim(),
  priceEstimateFCFA: z
    .number()
    .min(0, 'Le montant estime ne peut pas etre negatif')
    .optional(),
  isAvailable: z.boolean().default(true),
});

export const addProjectSchema = z.object({
  title: z
    .string({ message: 'Le titre du projet est obligatoire' })
    .min(3, 'Le titre doit comporter au moins 3 caracteres')
    .max(120)
    .trim(),
  description: z
    .string({ message: 'La description de la realisation est obligatoire' })
    .min(10, 'La description doit comporter au moins 10 caracteres')
    .max(1000)
    .trim(),
  location: z.string().trim().optional(),
  year: z.number().min(1950).max(2100).optional(),
  photos: z.array(z.string().url('URL d image invalide')).default([]),
});

export const queryProsSchema = z.object({
  search: z.string().trim().optional(),
  specialty: z.string().trim().optional(),
  city: z.string().trim().optional(),
  district: z.string().trim().optional(),
  isVerified: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  page: z
    .string()
    .default('1')
    .transform((val) => Math.max(1, parseInt(val, 10) || 1)),
  limit: z
    .string()
    .default('20')
    .transform((val) => Math.min(50, Math.max(1, parseInt(val, 10) || 20))),
});

export type UpdateProProfileInput = z.infer<typeof updateProProfileSchema>;
export type AddServiceInput = z.infer<typeof addServiceSchema>;
export type AddProjectInput = z.infer<typeof addProjectSchema>;
export type QueryProsInput = z.infer<typeof queryProsSchema>;
