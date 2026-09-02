import { z } from 'zod';

const propertyTypeEnum = z.enum(
  [
    'terrain_nu',
    'terrain_villageois',
    'maison',
    'villa',
    'cite',
    'appartement',
    'immeuble',
    'commerce',
  ],
  { message: 'Type de bien immobilier invalide' }
);

const titleTypeEnum = z.enum(
  ['ACD', 'CMP', 'arrete_concession', 'lettre_attribution', 'autre'],
  { message: 'Type de titre foncier invalide' }
);

export const createListingSchema = z.object({
  title: z
    .string({ message: 'Le titre de l annonce est obligatoire' })
    .min(5, 'Le titre doit comporter au moins 5 caracteres')
    .max(150, 'Le titre ne peut pas depasser 150 caracteres')
    .trim(),
  description: z
    .string({ message: 'La description est obligatoire' })
    .min(20, 'La description doit comporter au moins 20 caracteres')
    .max(3000)
    .trim(),
  propertyType: propertyTypeEnum,
  priceFCFA: z
    .number({ message: 'Le prix en FCFA est obligatoire' })
    .positive('Le prix doit etre strictement superieur a 0'),
  surfaceM2: z
    .number({ message: 'La surface en m2 est obligatoire' })
    .positive('La surface doit etre strictement superieure a 0'),
  city: z
    .string({ message: 'La ville est obligatoire' })
    .min(2)
    .trim(),
  district: z.string().trim().optional(),
  neighborhood: z.string().trim().optional(),
  titleType: titleTypeEnum,
  coordinates: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
  images: z
    .array(z.string().url('URL d image invalide'))
    .min(1, 'Au moins une photo du bien est obligatoire')
    .max(15, 'Maximum 15 photos autorisees'),
});

export const updateListingSchema = createListingSchema.partial();

export const queryListingsSchema = z.object({
  propertyType: propertyTypeEnum.optional(),
  city: z.string().trim().optional(),
  district: z.string().trim().optional(),
  titleType: titleTypeEnum.optional(),
  minPrice: z
    .string()
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val >= 0, { message: 'Prix min invalide' })
    .optional(),
  maxPrice: z
    .string()
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val >= 0, { message: 'Prix max invalide' })
    .optional(),
  minSurface: z
    .string()
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val > 0, { message: 'Surface min invalide' })
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
  sort: z
    .enum(['recent', 'price_asc', 'price_desc', 'surface_desc'])
    .default('recent'),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type QueryListingsInput = z.infer<typeof queryListingsSchema>;
