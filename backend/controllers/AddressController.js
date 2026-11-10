import Address from '../models/AddressModel.js';
import { stateNameByCode } from '../config/indianStates.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

const MAX_ADDRESSES = 10;
const FIELDS = ['label', 'fullName', 'companyName', 'line1', 'line2', 'city', 'pincode'];

function pickFields(body) {
  const data = Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, String(body[f]).trim()]));
  data.phone = body.phone.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '');
  data.stateCode = body.stateCode;
  data.state = stateNameByCode(body.stateCode);
  return data;
}

const clearOtherDefaults = (userId, keepId) => Address.updateMany({ user: userId, _id: { $ne: keepId } }, { $set: { isDefault: false } });

export async function listAddresses(req, res, next) {
  try {
    return ApiResponse.ok(res, await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 }).lean());
  } catch (error) { return next(error); }
}

export async function createAddress(req, res, next) {
  try {
    const count = await Address.countDocuments({ user: req.user._id });
    if (count >= MAX_ADDRESSES) throw ApiError.badRequest(`You can save up to ${MAX_ADDRESSES} addresses`);
    const address = await Address.create({ ...pickFields(req.body), user: req.user._id, isDefault: count === 0 || req.body.isDefault === true });
    if (address.isDefault) await clearOtherDefaults(req.user._id, address._id);
    return ApiResponse.created(res, address, 'Address saved');
  } catch (error) { return next(error); }
}

export async function updateAddress(req, res, next) {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!address) throw ApiError.notFound('Address not found');
    Object.assign(address, pickFields(req.body));
    if (req.body.isDefault === true) address.isDefault = true;
    await address.save();
    if (address.isDefault) await clearOtherDefaults(req.user._id, address._id);
    return ApiResponse.ok(res, address, 'Address updated');
  } catch (error) { return next(error); }
}

export async function deleteAddress(req, res, next) {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!address) throw ApiError.notFound('Address not found');
    if (address.isDefault) {
      const next1 = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 });
      if (next1) await Address.updateOne({ _id: next1._id }, { $set: { isDefault: true } });
    }
    return ApiResponse.ok(res, null, 'Address removed');
  } catch (error) { return next(error); }
}
