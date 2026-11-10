/**
 * Creates or updates the admin account from ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD in backend/.env.
 * Refuses to run without them: there is no default password. Usage: npm run seed:admin
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/databaseConfig.js';
import User from '../models/UserModel.js';

async function seed() {
  const { ADMIN_NAME = 'Site Admin', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env first.');
  if (ADMIN_PASSWORD.length < 10) throw new Error('ADMIN_PASSWORD must be at least 10 characters.');

  await connectDatabase();
  const email = ADMIN_EMAIL.trim().toLowerCase();
  const user = (await User.findOne({ email })) ?? new User({ email });
  Object.assign(user, { name: ADMIN_NAME, password: ADMIN_PASSWORD, role: 'admin', isEmailVerified: true, isActive: true });
  await user.save();
  console.log(`Admin account ready: ${email}`);
}

seed().catch((e) => { console.error(e.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
