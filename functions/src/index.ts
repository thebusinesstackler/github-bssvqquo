import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import * as cors from 'cors';

admin.initializeApp();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// CORS middleware
const corsHandler = cors({ origin: true });

// Price plan mappings
const PRICE_PLANS = {
  'price_1R8ncM4Ni6a2sxmWGu3hnPHs': 'Basic',
  'price_1R8ncw4Ni6a2sxmWAI7h3Bgn': 'Pro', 
  'price_1R8ndH4Ni6a2sxmW1A9VyiiR': 'Enterprise',
};

const PLAN_LIMITS = {
  'Basic': 50,
  'Pro': 100,
  'Enterprise': 500
};

const PLAN_AMOUNTS = {
  'Basic': 2160,
  'Pro': 3650,
  'Enterprise': 4400
};

// Create Stripe Checkout Session
export const createStripeCheckoutSession = functions.https.onRequest((req, res) => {
  return corsHandler(req, res, async () => {
    try {
      // Verify Firebase ID token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new functions.https.HttpsError('unauthenticated', 'No token provided');
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      const { priceId } = req.body;
      if (!priceId) {
        throw new functions.https.HttpsError('invalid-argument', 'Price ID is required');
      }

      // Get user data from Firestore
      const userDoc = await admin.firestore().collection('partners').doc(decodedToken.uid).get();
      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Partner not found');
      }

      const userData = userDoc.data();
      let customerId = userData?.stripeCustomerId;

      // Create or get Stripe customer
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: decodedToken.email || undefined,
          metadata: {
            firebaseUID: decodedToken.uid,
          },
        });
        customerId = customer.id;

        // Update user with Stripe customer ID
        await admin.firestore().collection('partners').doc(decodedToken.uid).update({
          stripeCustomerId: customerId,
        });
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.WEBAPP_URL}/settings/billing?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.WEBAPP_URL}/settings/billing?canceled=true`,
        metadata: {
          firebaseUID: decodedToken.uid,
        },
      });

      res.json({ id: session.id });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });
});

// Handle successful payment and create subscription
export const handlePaymentSuccess = functions.https.onRequest((req, res) => {
  return corsHandler(req, res, async () => {
    try {
      // Verify Firebase ID token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new functions.https.HttpsError('unauthenticated', 'No token provided');
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      // Get payment intent ID from request body
      const { paymentIntentId } = req.body;
      if (!paymentIntentId) {
        throw new functions.https.HttpsError('invalid-argument', 'Payment Intent ID is required');
      }

      // Retrieve the payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (!paymentIntent.metadata.firebaseUID || !paymentIntent.metadata.priceId) {
        throw new Error('Invalid payment intent metadata');
      }

      // Verify the user matches the payment intent
      if (paymentIntent.metadata.firebaseUID !== decodedToken.uid) {
        throw new functions.https.HttpsError('permission-denied', 'Payment intent does not belong to this user');
      }

      // Get the plan details
      const planName = PRICE_PLANS[paymentIntent.metadata.priceId as keyof typeof PRICE_PLANS] || 'Basic';
      const maxLeads = PLAN_LIMITS[planName as keyof typeof PLAN_LIMITS];
      const amount = PLAN_AMOUNTS[planName as keyof typeof PLAN_AMOUNTS];

      // Create the subscription
      const subscription = await stripe.subscriptions.create({
        customer: paymentIntent.customer as string,
        items: [{ price: paymentIntent.metadata.priceId }],
        default_payment_method: paymentIntent.payment_method as string,
        metadata: {
          firebaseUID: paymentIntent.metadata.firebaseUID
        }
      });

      // Update user's subscription details in Firestore
      await admin.firestore().collection('partners').doc(decodedToken.uid).update({
        subscription: planName,
        stripeCustomerId: paymentIntent.customer,
        subscriptionId: subscription.id,
        'billing.status': subscription.status,
        'billing.plan': planName,
        'billing.nextBillingDate': new Date(subscription.current_period_end * 1000),
        'billing.amount': amount,
        'maxLeads': maxLeads,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Return subscription details
      res.json({
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end,
          plan: planName,
          amount: amount,
          maxLeads: maxLeads,
          customerId: paymentIntent.customer
        }
      });
    } catch (error) {
      console.error('Error handling payment success:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });
});

// List Payment Methods
export const listPaymentMethods = functions.https.onRequest((req, res) => {
  return corsHandler(req, res, async () => {
    try {
      // Verify Firebase ID token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new functions.https.HttpsError('unauthenticated', 'No token provided');
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      const userDoc = await admin.firestore().collection('partners').doc(decodedToken.uid).get();
      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Partner not found');
      }

      const userData = userDoc.data();
      if (!userData?.stripeCustomerId) {
        return res.json([]);
      }

      const paymentMethods = await stripe.paymentMethods.list({
        customer: userData.stripeCustomerId,
        type: 'card',
      });

      res.json(paymentMethods.data);
    } catch (error) {
      console.error('Error listing payment methods:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });
});

// Create Customer Portal Session
export const createCustomerPortalSession = functions.https.onRequest((req, res) => {
  return corsHandler(req, res, async () => {
    try {
      // Verify Firebase ID token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new functions.https.HttpsError('unauthenticated', 'No token provided');
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      const userDoc = await admin.firestore().collection('partners').doc(decodedToken.uid).get();
      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Partner not found');
      }

      const userData = userDoc.data();
      if (!userData?.stripeCustomerId) {
        throw new functions.https.HttpsError('failed-precondition', 'No Stripe customer found');
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: userData.stripeCustomerId,
        return_url: `${process.env.WEBAPP_URL}/settings/billing`,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });
});

// Delete Payment Method
export const deletePaymentMethod = functions.https.onRequest((req, res) => {
  return corsHandler(req, res, async () => {
    try {
      // Verify Firebase ID token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new functions.https.HttpsError('unauthenticated', 'No token provided');
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      const { paymentMethodId } = req.body;
      if (!paymentMethodId) {
        throw new functions.https.HttpsError('invalid-argument', 'Payment method ID is required');
      }

      await stripe.paymentMethods.detach(paymentMethodId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting payment method:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });
});