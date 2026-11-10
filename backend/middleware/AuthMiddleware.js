import User from '../models/UserModel.js';
import ApiError from '../utils/ApiError.js';
import { verifyToken } from '../utils/GenerateToken.js';

/** Requires a valid Bearer token. Sets req.user. Rejects deactivated users and tokens issued before a password change. */
export async function protect(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw ApiError.unauthorized();

    const { id, iat } = verifyToken(token);
    const user = await User.findById(id);
    if (!user || !user.isActive) throw ApiError.unauthorized('Your account is not available');
    if (user.passwordChangedAt && Math.floor(user.passwordChangedAt.getTime() / 1000) > iat) {
      throw ApiError.unauthorized('Your password was changed. Please log in again.');
    }
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}
