import { Server as SocketServer } from 'socket.io';
import { prisma } from '../prisma';
import {
  NotificationType,
  SocketNotificationEvent,
} from '@campusloop/shared';
import { logger } from '../logger';

let _io: SocketServer | null = null;

export function setSocketServer(io: SocketServer): void {
  _io = io;
}

export function getSocketServer(): SocketServer | null {
  return _io;
}

export async function createAndSendNotification(opts: {
  recipientId: string;
  type: NotificationType;
  message: string;
  entityType?: string;
  entityId?: string;
}): Promise<void> {
  const notification = await prisma.notification.create({
    data: {
      recipientId: opts.recipientId,
      type: opts.type,
      message: opts.message,
      entityType: opts.entityType ?? null,
      entityId: opts.entityId ?? null,
    },
  });

  const event: SocketNotificationEvent = {
    notification: {
      id: notification.id,
      type: notification.type,
      entityType: notification.entityType,
      entityId: notification.entityId,
      message: notification.message,
      readAt: notification.readAt?.toISOString() ?? null,
      createdAt: notification.createdAt.toISOString(),
    },
  };

  if (_io) {
    _io.to(`user:${opts.recipientId}`).emit('notification', event);
  }

  logger.debug(`[Notification] Sent ${opts.type} to user ${opts.recipientId}`);
}
