import multer from 'multer';
import { config } from '../config';
import { BadRequestError } from '../shared/errors';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.storage.maxImageSizeMb * 1024 * 1024,
    files: config.storage.maxImagesPerListing,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      cb(new BadRequestError(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, WebP allowed.`));
    } else {
      cb(null, true);
    }
  },
});
