import { z } from 'zod';

const propertyTypeEnum = z.enum([
  'terrain_nu',
  'terrain_villageois',
  'maison',
  'villa',
  'cite',
  'appartement',
  'immeuble',
  'commerce',
]);

const titleTypeEnum = z.enum([
  'ACD',
  'CMP',
  'arrete_concession',
  'lettre_attribution',
  'autre',
]);

export const createAlertSchema = z.object({
  name: z
    .string({ message: 'Le nom de l alerte est obligatoire' })
    .min(2, 'Le nom de l alerte doit comporter au moins 2 caracteres')
    .max(100, 'Le nom ne peut pas depasser 100 caracteres')
    .trim(),
  propertyType: propertyTypeEnum.optional(),
  city: z.string().trim().optional(),
  district: z.string().trim().optional(),
  minPrice: z.number().min(0, 'Le prix minimum ne peut pas etre negatif').optional(),
  maxPrice: z.number().min(0, 'Le prix maximum ne peut pas etre negatif').optional(),
  minSurface: z.number().min(0, 'La surface minimum ne peut pas etre negative').optional(),
  titleType: titleTypeEnum.optional(),
  isActive: z.boolean().default(true),
});

export const updateAlertSchema = createAlertSchema.partial();

export const queryAlertsSchema = z.object({
  page: z
    .string()
    .default('1')
    .transform((val) => Math.max(1, parseInt(val, 10) || 1)),
  limit: z
    .string()
    .default('20')
    .transform((val) => Math.min(50, Math.max(1, parseInt(val, 10) || 20))),
});

export type CreateAlertInput = z.infer<typeof createAlertSchema>;
export type UpdateAlertInput = z.infer<typeof updateAlertSchema>;
export type QueryAlertsInput = z.infer<typeof queryAlertsSchema>;
