import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { app } from './app';
import { config } from './config';
import { logger } from './shared/logger';
import { setSocketServer } from './shared/notifications';
import { startAuctionWorker } from './workers/auctionWorker';
import { prisma } from './shared/prisma';

const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: {
    origin: config.cors.origin,
    credentials: true,
  },
});

setSocketServer(io);

io.on('connection', (socket) => {
  logger.debug(`[Socket] Client connected: ${socket.id}`);

  socket.on('join_user', (userId: string) => {
    if (userId) {
      socket.join(`user:${userId}`);
      logger.debug(`[Socket] ${socket.id} joined user:${userId}`);
    }
  });

  socket.on('join_conversation', (conversationId: string) => {
    if (conversationId) {
      socket.join(`conversation:${conversationId}`);
      logger.debug(`[Socket] ${socket.id} joined conversation:${conversationId}`);
    }
  });

  socket.on('leave_conversation', (conversationId: string) => {
    if (conversationId) {
      socket.leave(`conversation:${conversationId}`);
      logger.debug(`[Socket] ${socket.id} left conversation:${conversationId}`);
    }
  });

  socket.on('join_auction', (auctionId: string) => {
    if (auctionId) {
      socket.join(`auction:${auctionId}`);
      logger.debug(`[Socket] ${socket.id} joined auction:${auctionId}`);
    }
  });

  socket.on('leave_auction', (auctionId: string) => {
    if (auctionId) {
      socket.leave(`auction:${auctionId}`);
      logger.debug(`[Socket] ${socket.id} left auction:${auctionId}`);
    }
  });

  socket.on('disconnect', () => {
    logger.debug(`[Socket] Client disconnected: ${socket.id}`);
  });
});

async function main() {
  try {
    // Verify database connection
    await prisma.$connect();
    logger.info('[Database] Connected to PostgreSQL successfully.');
  } catch (err) {
    logger.warn('[Database] Could not connect to PostgreSQL on startup. Will retry on queries.', { err });
  }

  // Start background auction closing worker
  if (config.env !== 'test') {
    startAuctionWorker();
  }

  server.listen(config.port, () => {
    logger.info(`🚀 CampusLoop API server running on http://localhost:${config.port}`);
    logger.info(`   Environment: ${config.env}`);
    logger.info(`   CORS Origin: ${config.cors.origin}`);
  });
}

main().catch((err) => {
  logger.error('Fatal error during startup', { err });
  process.exit(1);
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down CampusLoop API server...');
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Server closed gracefully.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
