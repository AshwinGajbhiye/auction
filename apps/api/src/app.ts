import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import path from 'path';
import 'express-async-errors';

import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { requireAuth } from './middleware/auth';

// Routers
import { authRouter } from './modules/auth/auth.router';
import { collegesRouter } from './modules/colleges/colleges.router';
import { categoriesRouter } from './modules/categories/categories.router';
import { listingsRouter, myListingsHandler } from './modules/listings/listings.router';
import { auctionsRouter, myBidsHandler } from './modules/auctions/auctions.router';
import { offersRouter, createOfferHandler, myOffersHandler } from './modules/offers/offers.router';
import {
  purchasesRouter,
  createPurchaseRequestHandler,
  myPurchasesHandler,
} from './modules/purchases/purchases.router';
import { conversationsRouter } from './modules/conversations/conversations.router';
import {
  favouritesRouter,
  addFavouriteHandler,
  removeFavouriteHandler,
  myFavouritesHandler,
} from './modules/favourites/favourites.router';
import { notificationsRouter } from './modules/notifications/notifications.router';
import { reviewsRouter, createReviewHandler, getUserReviewsHandler } from './modules/reviews/reviews.router';
import { reportsRouter } from './modules/reports/reports.router';
import { adminRouter } from './modules/admin/admin.router';
import { usersRouter } from './modules/users/users.router';

export const app = express();

// Security & Optimization Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),
);

app.use(compression());
if (config.env !== 'test') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session Store Configuration
const PgStore = pgSession(session);
const sessionStore = config.db.url
  ? new PgStore({
      conString: config.db.url,
      tableName: 'session',
      createTableIfMissing: true,
    })
  : new session.MemoryStore();

app.use(
  session({
    store: sessionStore,
    name: config.session.cookieName,
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: config.env === 'production' ? 'none' : 'lax',
      maxAge: config.session.maxAgeMs,
    },
  }),
);

// Serve Static Uploads
const uploadDir = path.resolve(config.storage.localUploadDir);
app.use('/uploads', express.static(uploadDir));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    environment: config.env,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
const api = express.Router();

// Mount user "me" shortcuts before general :id params
api.get('/users/me/listings', requireAuth, myListingsHandler);
api.get('/users/me/offers', requireAuth, myOffersHandler);
api.get('/users/me/purchases', requireAuth, myPurchasesHandler);
api.get('/users/me/bids', requireAuth, myBidsHandler);
api.get('/users/me/favourites', requireAuth, myFavouritesHandler);
api.get('/users/:id/reviews', getUserReviewsHandler);

// Contextual subroutes on /listings/:id
api.post('/listings/:id/offers', requireAuth, createOfferHandler);
api.post('/listings/:id/purchase-requests', requireAuth, createPurchaseRequestHandler);
api.post('/listings/:id/favourite', requireAuth, addFavouriteHandler);
api.delete('/listings/:id/favourite', requireAuth, removeFavouriteHandler);

// Contextual subroutes on /purchases/:id
api.post('/purchases/:id/reviews', requireAuth, createReviewHandler);

// Resource routers
api.use('/auth', authRouter);
api.use('/colleges', collegesRouter);
api.use('/categories', categoriesRouter);
api.use('/listings', listingsRouter);
api.use('/auctions', auctionsRouter);
api.use('/offers', offersRouter);
api.use('/purchases', purchasesRouter);
api.use('/conversations', conversationsRouter);
api.use('/favourites', favouritesRouter);
api.use('/notifications', notificationsRouter);
api.use('/reviews', reviewsRouter);
api.use('/reports', reportsRouter);
api.use('/admin', adminRouter);
api.use('/users', usersRouter);

app.use('/api/v1', api);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Resource not found' },
  });
});

// Central Error Handler
app.use(errorHandler);
