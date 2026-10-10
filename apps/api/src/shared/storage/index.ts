import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { config } from '../../config';
import { logger } from '../logger';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function ensureLocalDir(): void {
  const dir = path.resolve(config.storage.localUploadDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export interface StoredFile {
  url: string;
  filename: string;
}

export async function storeImage(
  buffer: Buffer,
  originalMime: string,
  folder: string,
): Promise<StoredFile> {
  if (!ALLOWED_MIME_TYPES.includes(originalMime)) {
    throw new Error(`Invalid image type: ${originalMime}`);
  }

  // Resize and convert to webp for consistency
  const processed = await sharp(buffer)
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;

  if (config.storage.driver === 'local') {
    return storeLocal(processed, filename);
  }
  // s3 integration point — plug in AWS SDK here
  throw new Error('S3 storage not yet configured');
}

function storeLocal(buffer: Buffer, filename: string): StoredFile {
  ensureLocalDir();
  const fullPath = path.resolve(config.storage.localUploadDir, filename);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, buffer);
  const url = `/uploads/${filename}`;
  logger.debug(`[Storage] Saved local file: ${url}`);
  return { url, filename };
}

export async function deleteFile(filename: string): Promise<void> {
  if (config.storage.driver === 'local') {
    const fullPath = path.resolve(config.storage.localUploadDir, filename);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }
}
