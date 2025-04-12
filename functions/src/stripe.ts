import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const db = admin.firestore();

// Initialize Stripe with the secret key from environment variables or Firebase config
const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY || functions.config().stripe?.secret_key;
  if (!secretKey) {
    throw new Error('Missing Stripe secret key');
  }
  return new Stripe(secretKey, {
    apiVersion: '2023-10-16'
  });
};

export const createCheckoutSession = functions.firestore
  .document('stripe_checkout_sessions/{sessionId}')
  .onCreate(async (snap, context) => {
    try {
      const stripe = getStripe();
      const { price, success_url, cancel_url, mode, payment_method_types, metadata } = snap.data();

      // Pull out the partner ID and email from metadata
      const partnerId = metadata?.partnerId;
      const partnerEmail = metadata?.partnerEmail;
      const adminId = metadata?.adminId;

      if (!partnerId || !partnerEmail) {
        throw new Error('Missing partnerId or partnerEmail in metadata');
      }

      // If this is created by an admin for another user, log this information
      if (adminId) {
        functions.logger.info(`Admin ${adminId} is creating checkout for partner ${partnerId} (${partnerEmail})`);
      }

      // Get the partner document to see if they already have a Stripe customer ID
      const partnerDoc = await db.collection('partners').doc(partnerId).get();
      const partnerData = partnerDoc.data();
      
      let customerId = partnerData?.stripeCustomerId;

      // If no Stripe customer ID exists, create one
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: partnerEmail || 'unknown@example.com',
          name: partnerData?.name || 'Partner',
          metadata: { 
            partnerId,
            partnerEmail,
            ...(adminId && { createdByAdmin: adminId })
          }
        });
        customerId = customer.id;
        
        // Update the partner document with the new Stripe customer ID
        await db.collection('partners').doc(partnerId).update({
          stripeCustomerId: customerId
        });
      }

      // Create the Stripe checkout session with the customer ID
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types,
        mode,
        success_url,
        cancel_url,
        line_items: [{ price, quantity: 1 }],
        metadata: {
          ...metadata,
          partnerEmail // Ensure email is included in session metadata
        },
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        customer_update: {
          address: 'auto'
        }
      });

      // Update the checkout document with the session ID
      await snap.ref.update({
        sessionId: session.id,
        created: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      functions.logger.error('Error creating checkout session:', error);
      await snap.ref.update({ error: { message: error.message } });
    }
  });

export const createPortalSession = functions.firestore
  .document('stripe_portal_sessions/{sessionId}')
  .onCreate(async (snap, context) => {
    try {
      const stripe = getStripe();
      const { partnerId, partnerEmail, returnUrl } = snap.data();

      // Get partner's Stripe customer ID
      const partnerDoc = await db.collection('partners').doc(partnerId).get();
      const { stripeCustomerId } = partnerDoc.data() || {};

      if (!stripeCustomerId) {
        // Try to find customer by email if stripeCustomerId is not found
        functions.logger.info(`No Stripe customer ID found for partner ${partnerId}, searching by email: ${partnerEmail}`);
        
        if (!partnerEmail) {
          throw new Error('Partner email is required when customer ID is not available');
        }
        
        const customers = await stripe.customers.list({
          email: partnerEmail,
          limit: 1
        });
        
        if (customers.data.length === 0) {
          throw new Error(`No Stripe customer found for email: ${partnerEmail}`);
        }
        
        // Update the partner document with the found Stripe customer ID
        const foundCustomerId = customers.data[0].id;
        await db.collection('partners').doc(partnerId).update({
          stripeCustomerId: foundCustomerId
        });
        
        // Create portal session with the found customer ID
        const session = await stripe.billingPortal.sessions.create({
          customer: foundCustomerId,
          return_url: returnUrl
        });
        
        await snap.ref.update({
          url: session.url,
          created: admin.firestore.FieldValue.serverTimestamp()
        });
        
        return;
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: returnUrl
      });

      await snap.ref.update({
        url: session.url,
        created: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      await snap.ref.update({ error: { message: error.message } });
    }
  });

export const handleStripeWebhook = functions.https.onRequest(async (req, res) => {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || functions.config().stripe?.webhook_secret;
  
  if (!webhookSecret) {
    functions.logger.error('Missing Stripe webhook secret');
    res.status(500).send('Webhook Error: Missing webhook secret');
    return;
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig!,
      webhookSecret
    );
  } catch (err) {
    functions.logger.error('Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const { customer, status, items } = subscription;
        const priceId = items.data[0].price.id;

        // Get the price to determine the subscription tier
        const price = await stripe.prices.retrieve(priceId);
        const tier = price.metadata.tier || 'basic';
        const maxLeads = parseInt(price.metadata.maxLeads) || 50;

        // Get partner using customer metadata (which includes email)
        const stripeCustomer = await stripe.customers.retrieve(customer as string);
        const partnerId = stripeCustomer.metadata.partnerId;
        const partnerEmail = stripeCustomer.metadata.partnerEmail || stripeCustomer.email;

        // Find partner by email if partnerId is not available
        let partnerDocRef;
        if (partnerId) {
          partnerDocRef = db.collection('partners').doc(partnerId);
        } else if (partnerEmail) {
          // Query for partner by email
          const partnerQuery = await db.collection('partners')
            .where('email', '==', partnerEmail)
            .limit(1)
            .get();
            
          if (partnerQuery.empty) {
            throw new Error(`No partner found with email: ${partnerEmail}`);
          }
          
          partnerDocRef = partnerQuery.docs[0].ref;
        } else {
          throw new Error('No partner identification found in customer metadata');
        }

        // Update partner document
        await partnerDocRef.update({
          subscription: tier,
          maxLeads,
          'billing.status': status,
          'billing.stripePriceId': priceId,
          'billing.stripeSubscriptionId': subscription.id,
          'billing.nextBillingDate': new Date(subscription.current_period_end * 1000),
          'billing.amount': price.unit_amount ? price.unit_amount / 100 : 0
        });

        // Create a notification for the partner
        await db.collection('notifications').add({
          partnerId: partnerDocRef.id,
          title: 'Subscription Updated',
          message: `Your subscription has been ${event.type === 'customer.subscription.created' ? 'activated' : 'updated'} to ${tier} plan.`,
          type: 'system',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const partnerId = customer.metadata.partnerId;
        const partnerEmail = customer.metadata.partnerEmail || customer.email;

        // Find partner by email if partnerId is not available
        let partnerDocRef;
        if (partnerId) {
          partnerDocRef = db.collection('partners').doc(partnerId);
        } else if (partnerEmail) {
          // Query for partner by email
          const partnerQuery = await db.collection('partners')
            .where('email', '==', partnerEmail)
            .limit(1)
            .get();
            
          if (partnerQuery.empty) {
            throw new Error(`No partner found with email: ${partnerEmail}`);
          }
          
          partnerDocRef = partnerQuery.docs[0].ref;
        } else {
          throw new Error('No partner identification found in customer metadata');
        }

        await partnerDocRef.update({
          subscription: 'basic',
          maxLeads: 50,
          'billing.status': 'canceled',
          'billing.stripePriceId': null,
          'billing.stripeSubscriptionId': null
        });

        // Create a notification for the partner
        await db.collection('notifications').add({
          partnerId: partnerDocRef.id,
          title: 'Subscription Canceled',
          message: 'Your subscription has been canceled. You have been downgraded to the basic plan.',
          type: 'system',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        break;
      }

      case 'payment_method.attached':
      case 'payment_method.updated': {
        const paymentMethod = event.data.object;
        const { customer } = paymentMethod;

        if (customer && paymentMethod.card) {
          const stripeCustomer = await stripe.customers.retrieve(customer as string);
          const partnerId = stripeCustomer.metadata.partnerId;
          const partnerEmail = stripeCustomer.metadata.partnerEmail || stripeCustomer.email;

          // Find partner by email if partnerId is not available
          let partnerDocRef;
          if (partnerId) {
            partnerDocRef = db.collection('partners').doc(partnerId);
          } else if (partnerEmail) {
            // Query for partner by email
            const partnerQuery = await db.collection('partners')
              .where('email', '==', partnerEmail)
              .limit(1)
              .get();
              
            if (partnerQuery.empty) {
              throw new Error(`No partner found with email: ${partnerEmail}`);
            }
            
            partnerDocRef = partnerQuery.docs[0].ref;
          } else {
            throw new Error('No partner identification found in customer metadata');
          }

          await partnerDocRef.update({
            'billing.paymentMethod': {
              type: paymentMethod.type,
              last4: paymentMethod.card.last4,
              brand: paymentMethod.card.brand,
              expMonth: paymentMethod.card.exp_month,
              expYear: paymentMethod.card.exp_year
            }
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customer = await stripe.customers.retrieve(invoice.customer as string);
        const partnerId = customer.metadata.partnerId;
        const partnerEmail = customer.metadata.partnerEmail || customer.email;

        // Find partner by email if partnerId is not available
        let partnerDocRef;
        if (partnerId) {
          partnerDocRef = db.collection('partners').doc(partnerId);
        } else if (partnerEmail) {
          // Query for partner by email
          const partnerQuery = await db.collection('partners')
            .where('email', '==', partnerEmail)
            .limit(1)
            .get();
            
          if (partnerQuery.empty) {
            throw new Error(`No partner found with email: ${partnerEmail}`);
          }
          
          partnerDocRef = partnerQuery.docs[0].ref;
        } else {
          throw new Error('No partner identification found in customer metadata');
        }

        // Create a notification for the partner
        await db.collection('notifications').add({
          partnerId: partnerDocRef.id,
          title: 'Payment Successful',
          message: `Your payment of $${(invoice.amount_paid / 100).toFixed(2)} was successful.`,
          type: 'system',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customer = await stripe.customers.retrieve(invoice.customer as string);
        const partnerId = customer.metadata.partnerId;
        const partnerEmail = customer.metadata.partnerEmail || customer.email;

        // Find partner by email if partnerId is not available
        let partnerDocRef;
        if (partnerId) {
          partnerDocRef = db.collection('partners').doc(partnerId);
        } else if (partnerEmail) {
          // Query for partner by email
          const partnerQuery = await db.collection('partners')
            .where('email', '==', partnerEmail)
            .limit(1)
            .get();
            
          if (partnerQuery.empty) {
            throw new Error(`No partner found with email: ${partnerEmail}`);
          }
          
          partnerDocRef = partnerQuery.docs[0].ref;
        } else {
          throw new Error('No partner identification found in customer metadata');
        }

        // Create a notification for the partner
        await db.collection('notifications').add({
          partnerId: partnerDocRef.id,
          title: 'Payment Failed',
          message: 'Your latest payment attempt failed. Please update your payment method.',
          type: 'system',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    functions.logger.error('Error handling webhook:', error);
    res.status(500).send(`Server Error: ${error.message}`);
  }
});