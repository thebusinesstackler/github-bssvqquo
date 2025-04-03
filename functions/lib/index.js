"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStripePaymentMethod = exports.createCustomerPortalSession = exports.listStripePaymentMethods = exports.createStripeCheckoutSession = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe_1 = require("stripe");
const cors = require("cors");
admin.initializeApp();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
});
// CORS middleware
const corsHandler = cors({ origin: true });
// Create Stripe Checkout Session
exports.createStripeCheckoutSession = functions.https.onRequest((req, res) => {
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
        }
        catch (error) {
            console.error('Error creating checkout session:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    });
});
// List Payment Methods
exports.listStripePaymentMethods = functions.https.onRequest((req, res) => {
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
        }
        catch (error) {
            console.error('Error listing payment methods:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    });
});
// Create Customer Portal Session
exports.createCustomerPortalSession = functions.https.onRequest((req, res) => {
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
        }
        catch (error) {
            console.error('Error creating customer portal session:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    });
});
// Delete Payment Method
exports.deleteStripePaymentMethod = functions.https.onRequest((req, res) => {
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
        }
        catch (error) {
            console.error('Error deleting payment method:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    });
});
//# sourceMappingURL=index.js.map