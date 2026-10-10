import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

export const config = {
  env: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:4000',

  db: {
    url: process.env.DATABASE_URL || '',
  },

  session: {
    secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
    cookieName: 'campusloop.sid',
    maxAgeMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },

  email: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'CampusLoop <no-reply@campusloop.dev>',
  },

  storage: {
    driver: (process.env.STORAGE_DRIVER || 'local') as 'local' | 's3',
    localUploadDir: process.env.LOCAL_UPLOAD_DIR || './uploads',
    maxImageSizeMb: parseInt(process.env.MAX_IMAGE_SIZE_MB || '5', 10),
    maxImagesPerListing: parseInt(process.env.MAX_IMAGES_PER_LISTING || '8', 10),
    s3: {
      endpoint: process.env.S3_ENDPOINT || '',
      region: process.env.S3_REGION || 'auto',
      bucket: process.env.S3_BUCKET || '',
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      publicUrl: process.env.S3_PUBLIC_URL || '',
    },
  },

  auction: {
    closeCron: process.env.AUCTION_CLOSE_CRON || '* * * * *',
    snipeExtensionSeconds: parseInt(process.env.AUCTION_SNIPE_EXTENSION_SECONDS || '30', 10),
    snipeWindowSeconds: parseInt(process.env.AUCTION_SNIPE_WINDOW_SECONDS || '30', 10),
    snipeEnabled: process.env.AUCTION_SNIPE_ENABLED !== 'false',
  },

  security: {
    argon2MemoryCost: 65536,
    argon2TimeCost: 3,
    passwordResetExpiryMinutes: parseInt(process.env.PASSWORD_RESET_EXPIRY_MINUTES || '60', 10),
    emailVerifyExpiryHours: parseInt(process.env.EMAIL_VERIFY_EXPIRY_HOURS || '24', 10),
  },

  rateLimit: {
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10),
    authWindowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10),
  },
} as const;
