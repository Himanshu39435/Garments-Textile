import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import Category from '../models/CategoryModel.js';
import Product from '../models/ProductModel.js';
import { connectDatabase } from '../config/databaseConfig.js';
import { isCloudinaryConfigured } from '../config/cloudinaryConfig.js';
import { UPLOAD_DIR, uploadImage } from '../services/CloudinaryService.js';

const APPLY = process.argv.includes('--apply');
const LOCAL_IMAGE_URL = /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/uploads\//i;
const MIME_TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

function localFilename(url) {
  if (!LOCAL_IMAGE_URL.test(url)) return null;
  const filename = path.basename(new URL(url).pathname);
  return filename && filename !== '.' ? filename : null;
}

async function main() {
  if (APPLY && !isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET first.');
  }

  await connectDatabase();
  const [products, categories] = await Promise.all([
    Product.find({ 'images.url': LOCAL_IMAGE_URL }),
    Category.find({ 'image.url': LOCAL_IMAGE_URL }),
  ]);
  const changes = [];

  for (const product of products) {
    product.images.forEach((image, index) => {
      const filename = localFilename(image.url);
      if (filename) changes.push({ document: product, kind: 'product', name: product.name, index, filename, image });
    });
  }
  for (const category of categories) {
    const filename = localFilename(category.image?.url || '');
    if (filename) changes.push({ document: category, kind: 'category', name: category.name, index: 0, filename, image: category.image });
  }

  const missingFiles = [];
  for (const change of changes) {
    try {
      await fs.access(path.join(UPLOAD_DIR, change.filename));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      missingFiles.push(change.filename);
    }
  }

  console.log(`Found ${changes.length} legacy localhost image URL(s).`);
  if (missingFiles.length) {
    console.error(`Missing ${missingFiles.length} source image file(s) in backend/uploads: ${[...new Set(missingFiles)].join(', ')}`);
    throw new Error('Restore the missing local image files before migration.');
  }
  if (!APPLY) {
    console.log('Dry run only; no files uploaded or database records changed. Review the target MONGODB_URI, then run npm run migrate:images -- --apply.');
    return;
  }

  const uploaded = new Map();
  for (const change of changes) {
    let remote = uploaded.get(change.filename);
    if (!remote) {
      const extension = path.extname(change.filename).toLowerCase();
      const mimetype = MIME_TYPES[extension];
      if (!mimetype) throw new Error(`Unsupported image type for ${change.filename}`);
      const buffer = await fs.readFile(path.join(UPLOAD_DIR, change.filename));
      remote = await uploadImage({ buffer, mimetype });
      uploaded.set(change.filename, remote);
    }

    if (change.kind === 'product') {
      const images = change.document.images.map((image, index) => index === change.index
        ? { ...image.toObject(), url: remote.url, publicId: remote.publicId }
        : image.toObject());
      change.document.images = images;
    } else {
      change.document.image = { url: remote.url, publicId: remote.publicId };
    }
    await change.document.save();
    console.log(`Updated ${change.kind} image: ${change.name}`);
  }

  console.log(`Migration complete. Uploaded ${uploaded.size} unique image file(s) to Cloudinary.`);
}

main()
  .catch((error) => {
    console.error(`Image migration failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
