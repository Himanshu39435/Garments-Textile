/**
 * Creates or updates one staff account from STAFF_NAME / STAFF_EMAIL / STAFF_PASSWORD in backend/.env, for testing.
 * Real staff are added by the admin in the panel. Usage: npm run seed:staff
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/databaseConfig.js';
import User from '../models/UserModel.js';

async function seed() {
  const { STAFF_NAME = 'Store Staff', STAFF_EMAIL, STAFF_PASSWORD } = process.env;
  if (!STAFF_EMAIL || !STAFF_PASSWORD) throw new Error('Set STAFF_EMAIL and STAFF_PASSWORD in backend/.env first.');
  if (STAFF_PASSWORD.length < 10) throw new Error('STAFF_PASSWORD must be at least 10 characters.');

  await connectDatabase();
  const email = STAFF_EMAIL.trim().toLowerCase();
  const existing = await User.findOne({ email });
  if (existing && existing.role !== 'staff') throw new Error(`${email} already belongs to a ${existing.role} account. Use a different email.`);
  const user = existing ?? new User({ email });
  Object.assign(user, { name: STAFF_NAME, password: STAFF_PASSWORD, role: 'staff', isEmailVerified: true, isActive: true });
  await user.save();
  console.log(`Staff account ready: ${email}`);
}

seed().catch((e) => { console.error(e.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
