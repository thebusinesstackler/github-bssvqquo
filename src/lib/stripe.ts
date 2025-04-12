import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { db } from './firebase';
import { 
  collection, 
  addDoc,
  updateDoc, 
  doc,
  getDoc,
  query,
  where,
  getDocs,
  onSnapshot
} from 'firebase/firestore';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

export const createSubscription = async (partnerId: string, priceId: string, adminId?: string) => {
  try {
    // Validate parameters
    if (!partnerId) {
      throw new Error('Partner ID is required');
    }
    
    if (!priceId) {
      throw new Error('Price ID is required');
    }

    // Get partner document - validate the partner exists first
    const partnerRef = doc(db, 'partners', partnerId);
    const partnerDoc = await getDoc(partnerRef);
    
    if (!partnerDoc.exists()) {
      // If partner document doesn't exist, check if user exists in auth
      // and create a basic partner document
      console.log('Partner document not found, attempting to create one');
      
      // For now, we'll just log this case and throw an error
      // In a real implementation, you might create the partner document here
      throw new Error('Partner document not found in Firestore');
    }

    const partnerData = partnerDoc.data();
    const partnerEmail = partnerData.email;

    // Create checkout session using email as the key identifier
    const checkoutSessionRef = await addDoc(collection(db, 'stripe_checkout_sessions'), {
      price: priceId,
      success_url: window.location.origin + '/settings?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: window.location.origin + '/pricing',
      mode: 'subscription',
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      metadata: {
        partnerId,
        partnerEmail, // Adding email as a metadata field for better identification
        // Include admin ID if this was initiated by an admin
        ...(adminId && { adminId })
      }
    });

    // Wait for the checkout session to be created by the Firebase function
    return new Promise<void>((resolve, reject) => {
      const unsubscribe = onSnapshot(checkoutSessionRef, async (snap) => {
        const { sessionId, error } = snap.data() || {};
        
        if (error) {
          unsubscribe();
          reject(new Error(error.message));
          return;
        }
        
        if (sessionId) {
          const stripe = await getStripe();
          if (!stripe) {
            unsubscribe();
            reject(new Error('Stripe failed to initialize'));
            return;
          }
          
          // Redirect to checkout
          const { error: redirectError } = await stripe.redirectToCheckout({ sessionId });
          if (redirectError) {
            unsubscribe();
            reject(new Error(redirectError.message));
            return;
          }
          
          unsubscribe();
          resolve();
        }
      }, (error) => {
        unsubscribe();
        reject(error);
      });
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};

export const updateSubscription = async (subscriptionId: string, newPriceId: string) => {
  try {
    if (!subscriptionId) {
      throw new Error('Subscription ID is required');
    }
    
    if (!newPriceId) {
      throw new Error('Price ID is required');
    }
    
    const subscriptionRef = doc(db, 'stripe_subscriptions', subscriptionId);
    await updateDoc(subscriptionRef, {
      priceId: newPriceId,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
};

export const cancelSubscription = async (subscriptionId: string) => {
  try {
    if (!subscriptionId) {
      throw new Error('Subscription ID is required');
    }
    
    const subscriptionRef = doc(db, 'stripe_subscriptions', subscriptionId);
    await updateDoc(subscriptionRef, {
      status: 'canceled',
      canceledAt: new Date()
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};

export const getCustomerPortalUrl = async (partnerId: string) => {
  try {
    if (!partnerId) {
      throw new Error('Partner ID is required');
    }
    
    // Get partner email
    const partnerRef = doc(db, 'partners', partnerId);
    const partnerDoc = await getDoc(partnerRef);
    
    if (!partnerDoc.exists()) {
      throw new Error('Partner document not found');
    }
    
    const partnerData = partnerDoc.data();
    const partnerEmail = partnerData.email;
    
    const portalSessionRef = await addDoc(collection(db, 'stripe_portal_sessions'), {
      partnerId,
      partnerEmail, // Adding email for identification
      returnUrl: window.location.origin + '/settings'
    });

    // Wait for the portal session to be created by the Firebase function
    return new Promise<void>((resolve, reject) => {
      const unsubscribe = onSnapshot(portalSessionRef, async (snap) => {
        const { url, error } = snap.data() || {};
        
        if (error) {
          unsubscribe();
          reject(new Error(error.message));
          return;
        }
        
        if (url) {
          unsubscribe();
          window.location.href = url;
          resolve();
        }
      }, (error) => {
        unsubscribe();
        reject(error);
      });
    });
  } catch (error) {
    console.error('Error getting customer portal URL:', error);
    throw error;
  }
};

export const listPaymentMethods = async (partnerId: string) => {
  try {
    if (!partnerId) {
      throw new Error('Partner ID is required');
    }
    
    // First get the partner's email
    const partnerRef = doc(db, 'partners', partnerId);
    const partnerDoc = await getDoc(partnerRef);
    
    if (!partnerDoc.exists()) {
      throw new Error('Partner document not found');
    }
    
    const partnerData = partnerDoc.data();
    const partnerEmail = partnerData.email;
    
    // Query by email as well as partnerId for redundancy
    const paymentMethodsQuery = query(
      collection(db, 'stripe_payment_methods'),
      where('partnerEmail', '==', partnerEmail)
    );
    
    const snapshot = await getDocs(paymentMethodsQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error listing payment methods:', error);
    throw error;
  }
};

export const deletePaymentMethod = async (paymentMethodId: string) => {
  try {
    if (!paymentMethodId) {
      throw new Error('Payment method ID is required');
    }
    
    const paymentMethodRef = doc(db, 'stripe_payment_methods', paymentMethodId);
    await updateDoc(paymentMethodRef, {
      status: 'deleted',
      deletedAt: new Date()
    });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    throw error;
  }
};