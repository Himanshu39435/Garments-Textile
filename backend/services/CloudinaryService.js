import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';
import { Readable } from 'node:stream';
import { getCloudinary, isCloudinaryConfigured } from '../config/cloudinaryConfig.js';
import ApiError from '../utils/ApiError.js';

export const UPLOAD_DIR = path.resolve(import.meta.dirname, '../uploads');
const EXTENSIONS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const apiBase = () => process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;

/**
 * Stores an image and returns { url, publicId }.
 *  - Cloudinary when CLOUDINARY_* is set.
 *  - Otherwise, in development only, a local file under backend/uploads (served at /uploads).
 *  - Otherwise (production without Cloudinary) it refuses, so images are never silently lost.
 */
export async function uploadImage(file, folder = 'narang-textile') {
  if (isCloudinaryConfigured()) {
    const cloudinary = getCloudinary();
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (error, result) => (error ? reject(error) : resolve({ url: result.secure_url, publicId: result.public_id })));
      Readable.from(file.buffer).pipe(stream);
    });
  }
  if (process.env.NODE_ENV === 'production') throw new ApiError(503, 'Image storage is not configured. Set CLOUDINARY_* variables in backend/.env');

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${crypto.randomUUID()}${EXTENSIONS[file.mimetype]}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), file.buffer);
  return { url: `${apiBase()}/uploads/${name}`, publicId: `local:${name}` };
}

/** Best-effort removal. A failure is logged, never thrown, so it cannot block saving a product. */
export async function deleteImage(publicId) {
  if (!publicId) return;
  try {
    if (publicId.startsWith('local:')) await fs.unlink(path.join(UPLOAD_DIR, path.basename(publicId.slice(6)))).catch((e) => { if (e.code !== 'ENOENT') throw e; });
    else if (isCloudinaryConfigured()) await getCloudinary().uploader.destroy(publicId);
  } catch (error) {
    console.warn(`Could not delete image ${publicId}: ${error.message}`);
  }
}

export const deleteImages = (images = []) => Promise.all(images.map((i) => deleteImage(i.publicId)));
