import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Chargement du fichier .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Schema de validation strict des variables d'environnement
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'staging', 'production', 'test'])
    .default('development'),
  PORT: z
    .string()
    .default('5000')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0 && val <= 65535, {
      message: 'PORT doit etre un numero de port valide (1-65535)',
    }),
  MONGODB_URI: z
    .string({
      message: 'MONGODB_URI est obligatoire pour connecter la base',
    })
    .min(1, 'MONGODB_URI ne peut pas etre vide'),
  JWT_ACCESS_SECRET: z
    .string({
      message: 'JWT_ACCESS_SECRET est obligatoire pour securiser les tokens',
    })
    .min(32, 'JWT_ACCESS_SECRET doit comporter au moins 32 caracteres'),
  JWT_REFRESH_SECRET: z
    .string({
      message: 'JWT_REFRESH_SECRET est obligatoire pour la rotation des sessions',
    })
    .min(32, 'JWT_REFRESH_SECRET doit comporter au moins 32 caracteres'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://localhost:3000')
    .transform((val) => val.split(',').map((origin) => origin.trim())),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  COMMERCIAL_MODE: z.enum(['free', 'paid']).default('free'),
});

// Analyse et validation
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Erreur critique de configuration des variables d environnement :');
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;
