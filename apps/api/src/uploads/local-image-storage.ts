import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { ImageExtension } from './image-type';

export const UPLOAD_URL_PREFIX = '/uploads/';
const PRODUCT_FOLDER = 'products';

export function uploadRoot(): string {
  return resolve(process.env.UPLOAD_DIR ?? 'uploads');
}

/**
 * Saves product photos on this server's disk until cloud storage (S3/Cloudinary) is set up.
 * Swap this class for a cloud implementation without changing callers: they only get a URL back.
 */
@Injectable()
export class LocalImageStorage {
  async saveProductImage(
    buffer: Buffer,
    extension: ImageExtension,
  ): Promise<string> {
    const folder = join(uploadRoot(), PRODUCT_FOLDER);
    const fileName = `${randomUUID()}.${extension}`;
    await mkdir(folder, { recursive: true });
    await writeFile(join(folder, fileName), buffer);
    return `${UPLOAD_URL_PREFIX}${PRODUCT_FOLDER}/${fileName}`;
  }
}
