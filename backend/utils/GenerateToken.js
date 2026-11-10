import jwt from 'jsonwebtoken';

/** Signs a JWT carrying the user id and role. */
export function generateToken(user) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set in backend/.env');
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
