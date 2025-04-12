import * as functions from 'firebase-functions';

export const stripeConfig = {
  secretKey: functions.config().stripe?.secret_key || process.env.STRIPE_SECRET_KEY,
  webhookSecret: functions.config().stripe?.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET,
  publishableKey: functions.config().stripe?.publishable_key || process.env.STRIPE_PUBLISHABLE_KEY
};