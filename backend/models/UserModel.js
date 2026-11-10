import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

export const USER_ROLES = ['customer', 'staff', 'admin'];
const BCRYPT_ROUNDS = 12;

// A real sub-schema (not a nested `type: {}`), so Mongoose tracks changes such as attempts += 1.
const otpSchema = new mongoose.Schema(
  { codeHash: String, purpose: { type: String, enum: ['verify', 'reset'] }, expiresAt: Date, attempts: { type: Number, default: 0 }, sentAt: Date },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: 'customer' },
    isEmailVerified: { type: Boolean, default: false },
    designation: { type: String, trim: true, maxlength: 60 }, // staff only, e.g. "Dispatch executive"
    isActive: { type: Boolean, default: true },
    business: {
      companyName: { type: String, trim: true, maxlength: 120 },
      gstin: { type: String, trim: true, uppercase: true, maxlength: 15 },
      businessType: { type: String, trim: true, maxlength: 60 },
    },
    // One-time code for email verification or password reset. Only a hash is stored.
    otp: { type: otpSchema, select: false },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    passwordChangedAt: Date,
    lastLoginAt: Date,
  },
  { timestamps: true },
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000); // invalidates older tokens
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

/** Fields that are safe to send to the browser. */
userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id, name: this.name, email: this.email, phone: this.phone, role: this.role,
    isEmailVerified: this.isEmailVerified, business: this.business, designation: this.designation, createdAt: this.createdAt,
  };
};

// Used to burn the same CPU time when an email is unknown, so login timing does not reveal accounts.
export const DUMMY_PASSWORD_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);
export const compareAgainstDummy = (plain) => bcrypt.compare(plain, DUMMY_PASSWORD_HASH);

export default mongoose.model('User', userSchema);
