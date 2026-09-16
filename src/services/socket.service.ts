import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env.config';
import { verifyAccessToken, AccessTokenPayload } from '../utils/token.util';
import { logger } from '../utils/logger';

interface SocketData {
  user?: AccessTokenPayload;
}

class SocketService {
  private io: Server | null = null;
  private readonly connectedUsers = new Map<string, Set<string>>(); // userId -> Set<socketId>

  init(httpServer: HttpServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: env.ALLOWED_ORIGINS,
        credentials: true,
      },
      pingTimeout: 30000,
      pingInterval: 25000,
    });

    // Middleware de sécurité : Authentification du handshake WebSocket via JWT
    this.io.use((socket: Socket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          (socket.handshake.headers?.authorization &&
            socket.handshake.headers.authorization.split(' ')[1]);

        if (token) {
          const payload = verifyAccessToken(token);
          socket.data.user = payload;
        }
        next();
      } catch {
        // Connexion acceptée en mode anonyme / public pour les événements généraux
        next();
      }
    });

    this.io.on('connection', (socket: Socket) => {
      const user = socket.data.user as AccessTokenPayload | undefined;

      if (user) {
        const userId = user.userId;

        // Enregistrement dans la table de présence
        if (!this.connectedUsers.has(userId)) {
          this.connectedUsers.set(userId, new Set());
        }
        this.connectedUsers.get(userId)?.add(socket.id);

        // Rejoindre sa room personnelle privée
        socket.join(`user:${userId}`);

        // Rejoindre les canaux sectoriels selon le rôle
        if (user.role === 'admin') {
          socket.join('admins');
        } else if (user.role === 'professionnel') {
          socket.join('pros');
        }

        logger.info('SYSTEM', `Client connecté en temps réel : ${userId} (${user.role}) [Socket: ${socket.id}]`);
      }

      socket.on('disconnect', () => {
        if (user) {
          const userId = user.userId;
          const userSockets = this.connectedUsers.get(userId);
          if (userSockets) {
            userSockets.delete(socket.id);
            if (userSockets.size === 0) {
              this.connectedUsers.delete(userId);
            }
          }
        }
      });
    });

    logger.info('SYSTEM', 'Cerveau Temps Réel Socket.io initialisé avec succès.');
  }

  getIO() {
    if (!this.io) {
      throw new Error('Socket.io n est pas encore initialisé. Appelez socketService.init(server) d abord.');
    }
    return this.io;
  }

  // 1. Distribution ciblée à un utilisateur spécifique (ses appareils connectés)
  sendToUser(userId: string, event: string, payload: unknown): void {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, payload);
  }

  // 2. Notification prioritaire à tous les administrateurs
  sendToAdmins(event: string, payload: unknown): void {
    if (!this.io) return;
    this.io.to('admins').emit(event, payload);
  }

  // 3. Diffusion à tous les professionnels vérifiés
  sendToPros(event: string, payload: unknown): void {
    if (!this.io) return;
    this.io.to('pros').emit(event, payload);
  }

  // 4. Diffusion globale publique (ex: nouvelle annonce, nouvelle offre d'emploi)
  broadcast(event: string, payload: unknown): void {
    if (!this.io) return;
    this.io.emit(event, payload);
  }

  // 5. Diffusion dans une room thématique
  sendToRoom(room: string, event: string, payload: unknown): void {
    if (!this.io) return;
    this.io.to(room).emit(event, payload);
  }

  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId) && (this.connectedUsers.get(userId)?.size ?? 0) > 0;
  }

  getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }
}

export const socketService = new SocketService();
