import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from '../config/env.config';
import { logger } from '../utils/logger';

// Initialisation conditionnelle de Cloudinary
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  logger.info('SYSTEM', 'Service Cloudinary configuré avec succès.');
} else {
  logger.warn('SYSTEM', 'Identifiants Cloudinary non renseignés. Mode base64 de secours actif.');
}

export class CloudinaryService {
  async uploadBuffer(
    buffer: Buffer,
    folder = 'gayabtp/profiles',
    mimetype = 'image/jpeg'
  ): Promise<{ url: string; publicId?: string }> {
    // Si Cloudinary est configuré, envoyer sur le CDN
    if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
      return new Promise((resolve) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
          },
          (error, result?: UploadApiResponse) => {
            if (error || !result) {
              logger.error('SYSTEM', 'Échec upload Cloudinary', error);
              // Fallback Data URI en cas d'erreur réseau CDN
              const base64 = `data:${mimetype};base64,${buffer.toString('base64')}`;
              return resolve({ url: base64 });
            }
            resolve({
              url: result.secure_url || result.url,
              publicId: result.public_id,
            });
          }
        );
        uploadStream.end(buffer);
      });
    }

    // Mode secours Data URI
    const base64 = `data:${mimetype};base64,${buffer.toString('base64')}`;
    return { url: base64 };
  }

  async uploadBase64(base64Data: string, folder = 'gayabtp/profiles'): Promise<{ url: string; publicId?: string }> {
    if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
      try {
        const result = await cloudinary.uploader.upload(base64Data, {
          folder,
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        });
        return {
          url: result.secure_url || result.url,
          publicId: result.public_id,
        };
      } catch (error) {
        logger.error('SYSTEM', 'Échec upload base64 Cloudinary', error);
        return { url: base64Data };
      }
    }
    return { url: base64Data };
  }
}

export const cloudinaryService = new CloudinaryService();
