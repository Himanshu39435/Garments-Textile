import ApiResponse from '../utils/ApiResponse.js';
import { buildDashboard } from '../services/DashboardService.js';
import { uploadImage as storeImage } from '../services/CloudinaryService.js';

/** GET /api/admin/session. Lets the admin panel confirm server-side that the token belongs to an admin. */
export const getAdminSession = (req, res) => ApiResponse.ok(res, { user: req.user.toPublic() });

/** GET /api/admin/dashboard: headline numbers, 12-month sales, top products, low stock and recent orders. */
export async function getDashboard(_req, res, next) {
  try {
    return ApiResponse.ok(res, await buildDashboard());
  } catch (error) { return next(error); }
}

/** POST /api/admin/uploads/image: stores one image (Cloudinary, or a local file in development) and returns { url, publicId }. */
export async function uploadImage(req, res, next) {
  try {
    return ApiResponse.created(res, await storeImage(req.file), 'Image uploaded');
  } catch (error) { return next(error); }
}
