import { prisma } from '../../shared/prisma';
import { createAndSendNotification } from '../../shared/notifications';
import { getSocketServer } from '../../shared/notifications';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../shared/errors';
import type { SocketNewMessageEvent } from '@campusloop/shared';

export async function getOrCreateConversation(opts: {
  listingId: string;
  buyerId: string;
}) {
  const { listingId, buyerId } = opts;

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.status === 'DELETED') throw new NotFoundError('Listing');
  if (listing.sellerId === buyerId) throw new BadRequestError('You cannot message yourself.');

  const existing = await prisma.conversation.findUnique({
    where: { listingId_buyerId_sellerId: { listingId, buyerId, sellerId: listing.sellerId } },
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: { listingId, buyerId, sellerId: listing.sellerId },
  });
}

export async function getConversations(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
    include: {
      listing: { select: { id: true, title: true, status: true, images: { take: 1 } } },
      buyer: { select: { id: true, name: true, profileImageUrl: true } },
      seller: { select: { id: true, name: true, profileImageUrl: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { sender: { select: { id: true, name: true, profileImageUrl: true } } },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return conversations.map((c) => {
    const other = c.buyerId === userId ? c.seller : c.buyer;
    const lastMsg = c.messages[0] ?? null;
    return {
      id: c.id,
      listingId: c.listingId,
      listing: c.listing,
      otherParticipant: other,
      lastMessage: lastMsg
        ? { ...lastMsg, createdAt: lastMsg.createdAt.toISOString() }
        : null,
      unreadCount: 0, // computed below
      createdAt: c.createdAt.toISOString(),
    };
  });
}

export async function getMessages(
  conversationId: string,
  userId: string,
  page: number,
  pageSize: number,
) {
  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conv) throw new NotFoundError('Conversation');
  if (conv.buyerId !== userId && conv.sellerId !== userId) throw new ForbiddenError();

  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId },
      include: { sender: { select: { id: true, name: true, profileImageUrl: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.message.count({ where: { conversationId } }),
  ]);

  // Mark messages as read
  await prisma.message.updateMany({
    where: { conversationId, senderId: { not: userId }, readAt: null },
    data: { readAt: new Date() },
  });

  return {
    items: items.reverse().map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      readAt: m.readAt?.toISOString() ?? null,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function sendMessage(opts: {
  conversationId: string;
  senderId: string;
  content: string;
}) {
  const { conversationId, senderId, content } = opts;
  if (!content?.trim()) throw new BadRequestError('Message cannot be empty.');
  if (content.length > 2000) throw new BadRequestError('Message too long (max 2000 chars).');

  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conv) throw new NotFoundError('Conversation');
  if (conv.buyerId !== senderId && conv.sellerId !== senderId) throw new ForbiddenError();

  const message = await prisma.$transaction(async (tx) => {
    const msg = await tx.message.create({
      data: { conversationId, senderId, content: content.trim() },
      include: { sender: { select: { id: true, name: true, profileImageUrl: true } } },
    });
    await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    return msg;
  });

  const formatted = {
    id: message.id,
    conversationId: message.conversationId,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    readAt: message.readAt?.toISOString() ?? null,
    sender: message.sender,
  };

  // Emit via Socket.IO
  const io = getSocketServer();
  if (io) {
    const event: SocketNewMessageEvent = { conversationId, message: formatted as any };
    io.to(`conversation:${conversationId}`).emit('message:new', event);
  }

  // Notify the other participant
  const recipientId = conv.buyerId === senderId ? conv.sellerId : conv.buyerId;
  await createAndSendNotification({
    recipientId,
    type: 'NEW_MESSAGE',
    message: `New message from ${message.sender.name}.`,
    entityType: 'conversation',
    entityId: conversationId,
  });

  return formatted;
}
