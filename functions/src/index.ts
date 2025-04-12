import * as admin from 'firebase-admin';
import { handleStripeWebhook } from './stripe';

admin.initializeApp();

export {
  handleStripeWebhook
};