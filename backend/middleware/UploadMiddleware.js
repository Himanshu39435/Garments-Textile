import multer from 'multer';
import ApiError from '../utils/ApiError.js';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => (ALLOWED.includes(file.mimetype) ? cb(null, true) : cb(ApiError.badRequest('Upload a JPG, PNG or WebP image'))),
});

/** The browser-reported type can be faked, so check the file's own first bytes as well. */
function looksLikeImage(buffer, mimetype) {
  if (mimetype === 'image/jpeg') return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimetype === 'image/png') return buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimetype === 'image/webp') return buffer.length > 12 && buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
  return false;
}

/** Accepts one image in the `image` field (max 5 MB, JPG/PNG/WebP). Sets req.file. */
export function uploadSingleImage(req, res, next) {
  upload.single('image')(req, res, (error) => {
    if (error) {
      if (error.code === 'LIMIT_FILE_SIZE') return next(ApiError.badRequest('Image must be 5 MB or smaller'));
      if (error.code === 'LIMIT_UNEXPECTED_FILE') return next(ApiError.badRequest('Send one image in the "image" field'));
      return next(error);
    }
    if (!req.file) return next(ApiError.badRequest('Choose an image to upload'));
    if (!looksLikeImage(req.file.buffer, req.file.mimetype)) return next(ApiError.badRequest('That file is not a valid image'));
    return next();
  });
}
