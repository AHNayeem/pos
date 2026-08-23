import { repositories } from "@/repositories";
import type { Notification, NotificationType } from "@/domain/types";

type NotificationServiceError = { code: string; message: string };

export class NotificationService {
  static async getNotifications(filters?: { isRead?: boolean }) {
    const notifications = await repositories.notification.getAll(filters);
    return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getNotification(notificationId: string): Promise<Notification | null> {
    return repositories.notification.getById(notificationId);
  }

  static async createNotification(input: {
    type: NotificationType;
    title: string;
    message: string;
    isRead?: boolean;
  }): Promise<Notification> {
    if (!input.title || input.title.trim() === "") {
      throw { code: "INVALID_TITLE", message: "Title is required" } as NotificationServiceError;
    }
    if (!input.message || input.message.trim() === "") {
      throw { code: "INVALID_MESSAGE", message: "Message is required" } as NotificationServiceError;
    }
    return repositories.notification.create({
      type: input.type,
      title: input.title.trim(),
      message: input.message.trim(),
      isRead: input.isRead ?? false,
    });
  }

  static async markAsRead(notificationId: string): Promise<void> {
    await repositories.notification.markAsRead(notificationId);
  }

  static async markAllAsRead(): Promise<void> {
    await repositories.notification.markAllAsRead();
  }
}
