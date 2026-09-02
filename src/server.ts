import http from 'http';
import app from './app';
import { env } from './config/env.config';
import { connectDB, closeDB } from './config/db.config';
import { logger } from './utils/logger';

const server = http.createServer(app);

const startServer = async (): Promise<void> => {
  try {
    // 1. Connexion prealable a MongoDB
    await connectDB();

    // 2. Ecoute du serveur HTTP
    server.listen(env.PORT, () => {
      logger.info(
        'SYSTEM',
        `Serveur GayaBTP demarre avec succes sur le port ${env.PORT} en mode [${env.NODE_ENV}]`
      );
    });
  } catch (error) {
    logger.error('SYSTEM', 'Erreur fatale lors du demarrage du serveur', error);
    process.exit(1);
  }
};

// 3. Arret propre en cas de signal de terminaison (SIGINT / SIGTERM)
const handleGracefulShutdown = (signal: string) => {
  logger.info('SYSTEM', `Signal ${signal} recu. Fermeture propre du serveur en cours...`);
  server.close(async () => {
    await closeDB();
    logger.info('SYSTEM', 'Serveur et base de donnees arretes avec succes.');
    process.exit(0);
  });

  // Forcer l'arret apres 10 secondes si des connexions restent bloquees
  setTimeout(() => {
    logger.error('SYSTEM', 'Fermeture forcee apres delai depasse.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

// 4. Interception des exceptions et promesses non capturees
process.on('uncaughtException', (error: Error) => {
  logger.error('SYSTEM', 'Uncaught Exception detectee. Arret d urgence.', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('SYSTEM', 'Unhandled Rejection detectee.', reason);
  process.exit(1);
});

startServer();
