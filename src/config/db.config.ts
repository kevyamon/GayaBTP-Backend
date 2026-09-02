import mongoose from 'mongoose';
import { env } from './env.config';
import { logger } from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);

    const connectionOptions: mongoose.ConnectOptions = {
      autoIndex: env.NODE_ENV === 'development',
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(env.MONGODB_URI, connectionOptions);

    logger.info('SYSTEM', 'Connexion a la base de donnees MongoDB Atlas etablie avec succes');
  } catch (error) {
    logger.error('SYSTEM', 'Echec de la connexion initiale a MongoDB', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('SYSTEM', 'Connexion MongoDB perdue. Tentative de reconnexion automatique...');
});

mongoose.connection.on('reconnected', () => {
  logger.info('SYSTEM', 'Connexion MongoDB retablie avec succes');
});

mongoose.connection.on('error', (err) => {
  logger.error('SYSTEM', 'Erreur de connexion MongoDB', err);
});

export const closeDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info('SYSTEM', 'Connexion MongoDB fermee proprement');
  } catch (error) {
    logger.error('SYSTEM', 'Erreur lors de la fermeture de la connexion MongoDB', error);
  }
};
