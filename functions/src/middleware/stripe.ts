import * as functions from 'firebase-functions';
import Stripe from 'stripe';
import { stripeConfig } from '../config';

export const validateStripeWebhook = (stripe: Stripe) => async (req: functions.https.Request, res: functions.Response, next: Function) => {
  const sig = req.headers['stripe-signature'];

  try {
    req['stripeEvent'] = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      stripeConfig.webhookSecret
    );
    next();
  } catch (err) {
    functions.logger.error('Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};