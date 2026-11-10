import ApiResponse from '../utils/ApiResponse.js';
import { buildStaffDashboard } from '../services/StaffDashboardService.js';

/** GET /api/staff/session. Lets the staff area confirm server-side that the token belongs to staff. */
export const getStaffSession = (req, res) => ApiResponse.ok(res, { user: req.user.toPublic() });

/** GET /api/staff/dashboard: the work queue, low-stock list and this month's activity for the signed-in staff member. */
export async function getStaffDashboard(req, res, next) {
  try {
    return ApiResponse.ok(res, await buildStaffDashboard(req.user));
  } catch (error) { return next(error); }
}
