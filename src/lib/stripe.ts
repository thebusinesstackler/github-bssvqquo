import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { getAuth } from 'firebase/auth';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

const getAuthToken = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user.getIdToken();
};

export const createSubscription = async (priceId: string) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${import.meta.env.VITE_FIREBASE_FUNCTIONS_URL}/createStripeCheckoutSession`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ priceId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create subscription');
    }

    const data = await response.json();
    if (!data.id) {
      throw new Error('Invalid session ID');
    }

    const stripe = await getStripe();
    if (!stripe) throw new Error('Stripe failed to initialize');

    const { error } = await stripe.redirectToCheckout({
      sessionId: data.id,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create subscription');
  }
};

export const listPaymentMethods = async () => {
  try {
    const token = await getAuthToken();
    if (!token) {
      return []; // Return empty array if not authenticated
    }

    const response = await fetch(`${import.meta.env.VITE_FIREBASE_FUNCTIONS_URL}/listStripePaymentMethods`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to list payment methods');
    }

    return response.json();
  } catch (error) {
    console.error('Error listing payment methods:', error);
    return []; // Return empty array on error
  }
};

export const deletePaymentMethod = async (paymentMethodId: string) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${import.meta.env.VITE_FIREBASE_FUNCTIONS_URL}/deleteStripePaymentMethod`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentMethodId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete payment method');
    }

    return response.json();
  } catch (error) {
    console.error('Error deleting payment method:', error);
    throw error;
  }
};

export const getCustomerPortalUrl = async () => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${import.meta.env.VITE_FIREBASE_FUNCTIONS_URL}/createCustomerPortalSession`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get customer portal URL');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error getting customer portal URL:', error);
    throw error;
  }
};