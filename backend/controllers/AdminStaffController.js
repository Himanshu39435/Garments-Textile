import Order from '../models/OrderModel.js';
import Quotation from '../models/QuotationModel.js';
import User from '../models/UserModel.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

const ID = /^[a-f\d]{24}$/i;
const escapeRegex = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalisePhone = (p) => p.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '');
const publicFields = (u) => ({ _id: u._id, name: u.name, email: u.email, phone: u.phone, designation: u.designation, isActive: u.isActive, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt });

async function findStaff(req) {
  const user = ID.test(req.params.id) ? await User.findOne({ _id: req.params.id, role: 'staff' }) : null;
  if (!user) throw ApiError.notFound('Staff member not found');
  return user;
}

/** How many orders and quotations each staff member updated in the last 30 days (from the status history). */
async function recentActivity(staffIds) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const tally = (Model) => Model.aggregate([
    { $unwind: '$statusHistory' },
    { $match: { 'statusHistory.by': { $in: staffIds }, 'statusHistory.at': { $gte: since } } },
    { $group: { _id: '$statusHistory.by', count: { $sum: 1 } } },
  ]);
  const [orders, quotes] = await Promise.all([tally(Order), tally(Quotation)]);
  const byId = new Map();
  for (const row of [...orders, ...quotes]) byId.set(String(row._id), (byId.get(String(row._id)) ?? 0) + row.count);
  return byId;
}

/** GET /api/admin/staff */
export async function listStaff(req, res, next) {
  try {
    const filter = { role: 'staff' };
    if (req.query.search?.trim()) {
      const pattern = new RegExp(escapeRegex(req.query.search.trim().slice(0, 80)), 'i');
      filter.$or = [{ name: pattern }, { email: pattern }, { phone: pattern }, { designation: pattern }];
    }
    const users = await User.find(filter).sort({ createdAt: -1 }).lean();
    const activity = await recentActivity(users.map((u) => u._id));
    return ApiResponse.ok(res, users.map((u) => ({ ...publicFields(u), actionsLast30Days: activity.get(String(u._id)) ?? 0 })), 'Staff fetched');
  } catch (error) { return next(error); }
}

/** POST /api/admin/staff. The admin chooses the first password and shares it with the staff member. */
export async function createStaff(req, res, next) {
  try {
    const { name, email, phone, designation, password } = req.body;
    const normalised = email.trim().toLowerCase();
    if (await User.exists({ email: normalised })) throw ApiError.conflict('An account with this email already exists');
    const user = await User.create({ name: name.trim(), email: normalised, phone: normalisePhone(phone), designation: designation?.trim() || undefined, password, role: 'staff', isEmailVerified: true, isActive: true });
    return ApiResponse.created(res, publicFields(user), 'Staff account created');
  } catch (error) { return next(error); }
}

/** PUT /api/admin/staff/:id. Name, phone and designation. The email and role never change here. */
export async function updateStaff(req, res, next) {
  try {
    const user = await findStaff(req);
    const { name, phone, designation } = req.body;
    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = normalisePhone(phone);
    if (designation !== undefined) user.designation = designation?.trim() || undefined;
    await user.save();
    return ApiResponse.ok(res, publicFields(user), 'Staff member updated');
  } catch (error) { return next(error); }
}

/** PUT /api/admin/staff/:id/status. A deactivated staff member is signed out on their next request. */
export async function setStaffStatus(req, res, next) {
  try {
    const user = await findStaff(req);
    user.isActive = req.body.isActive;
    await user.save();
    return ApiResponse.ok(res, publicFields(user), user.isActive ? 'Staff member reactivated' : 'Staff member deactivated');
  } catch (error) { return next(error); }
}

/** PUT /api/admin/staff/:id/password. Sets a new password and signs the person out everywhere. */
export async function resetStaffPassword(req, res, next) {
  try {
    const user = await findStaff(req);
    user.password = req.body.newPassword;
    await user.save(); // UserModel hashes it and records passwordChangedAt, which invalidates older tokens
    return ApiResponse.ok(res, publicFields(user), 'Password reset. Share the new password with the staff member.');
  } catch (error) { return next(error); }
}
