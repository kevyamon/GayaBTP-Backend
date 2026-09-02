import { z } from 'zod';

export const createJobSchema = z.object({
  type: z.enum(['stage', 'emploi'], {
    message: 'Le type doit etre soit "stage" soit "emploi"',
  }),
  title: z
    .string({ message: 'Le titre de l offre est obligatoire' })
    .min(3, 'Le titre doit comporter au moins 3 caracteres')
    .max(120, 'Le titre ne peut pas depasser 120 caracteres')
    .trim(),
  specialty: z
    .string({ message: 'La specialite BTP est obligatoire' })
    .min(2, 'La specialite doit comporter au moins 2 caracteres')
    .trim(),
  city: z
    .string({ message: 'La ville est obligatoire' })
    .min(2, 'La ville doit comporter au moins 2 caracteres')
    .trim(),
  district: z.string().trim().optional(),
  duration: z.string().trim().optional(),
  isPaid: z.boolean().default(false),
  remunerationFCFA: z
    .number()
    .min(0, 'La remuneration ne peut pas etre negative')
    .optional(),
  description: z
    .string({ message: 'La description est obligatoire' })
    .min(20, 'La description doit comporter au moins 20 caracteres')
    .max(3000, 'La description ne peut pas depasser 3000 caracteres')
    .trim(),
  contactWhatsApp: z.string().trim().optional(),
  contactEmail: z.string().email('Format d email invalide').toLowerCase().trim().optional(),
  expiresAt: z
    .string()
    .transform((val) => new Date(val))
    .refine((date) => !isNaN(date.getTime()) && date > new Date(), {
      message: 'La date d expiration doit etre une date future valide',
    })
    .optional(),
});

export const updateJobSchema = createJobSchema.partial();

export const queryJobsSchema = z.object({
  type: z.enum(['stage', 'emploi']).optional(),
  specialty: z.string().trim().optional(),
  city: z.string().trim().optional(),
  isPaid: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  search: z.string().trim().optional(),
  page: z
    .string()
    .default('1')
    .transform((val) => Math.max(1, parseInt(val, 10) || 1)),
  limit: z
    .string()
    .default('20')
    .transform((val) => Math.min(50, Math.max(1, parseInt(val, 10) || 20))),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type QueryJobsInput = z.infer<typeof queryJobsSchema>;
