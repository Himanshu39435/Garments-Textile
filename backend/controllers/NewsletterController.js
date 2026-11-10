import NewsletterSubscriber from '../models/NewsletterSubscriberModel.js';
import ApiResponse from '../utils/ApiResponse.js';

/** POST /api/newsletter/subscribe. Idempotent: re-subscribing the same email succeeds quietly. */
export async function subscribe(req, res, next) {
  try {
    const email = req.body.email.trim().toLowerCase();
    await NewsletterSubscriber.updateOne({ email }, { $set: { isActive: true }, $setOnInsert: { email } }, { upsert: true });
    return ApiResponse.ok(res, null, 'You are subscribed. Watch your inbox for new fabrics.');
  } catch (error) {
    return next(error);
  }
}
