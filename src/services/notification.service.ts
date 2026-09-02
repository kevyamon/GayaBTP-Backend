import { Types } from 'mongoose';
import {
  Notification,
  INotification,
  NotificationType,
} from '../models/notification.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

interface CreateNotificationParams {
  userId: Types.ObjectId | string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

class NotificationService {
  async createNotification(params: CreateNotificationParams): Promise<INotification> {
    const notification = await Notification.create({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data || {},
      isRead: false,
    });

    logger.info('NOTIFICATION', `Notification creee pour l utilisateur ${params.userId} [${params.type}]`);

    return notification;
  }

  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async markAsRead(notificationId: string, userId: string): Promise<INotification> {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw AppError.badRequest('Identifiant de notification invalide.');
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );

    if (!notification) {
      throw AppError.notFound('Notification introuvable.');
    }

    return notification;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
  }
}

export const notificationService = new NotificationService();
