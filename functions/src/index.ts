import * as admin from 'firebase-admin';
import { handleStripeWebhook, handleCheckoutSessionCompleted } from './stripe';
import * as logger from 'firebase-functions/logger';
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

admin.initializeApp();

export {
  handleStripeWebhook,
};

export const onUserCreated = onDocumentCreated("users/{uid}", async (event) => {
  const { uid } = event.params;
  const user = await getAuth().getUser(uid);
  logger.info("user created: ", user);

  await getFirestore().collection("partners").doc(uid).set({ uid, email: user.email });
});