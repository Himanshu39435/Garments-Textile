import ApiError from '../utils/ApiError.js';

/**
 * Must run after `protect`. Allows only users whose role, as stored in the database (not the token), is in the list.
 * Usage: router.use(protect, requireRoles('admin', 'staff'))
 */
export const requireRoles = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user?.role)) return next(ApiError.forbidden('You do not have access to this area'));
  return next();
};

export const requireAdmin = requireRoles('admin');
export const requireStaff = requireRoles('staff');
export const requireStaffOrAdmin = requireRoles('admin', 'staff');
export const requireCustomer = requireRoles('customer');
