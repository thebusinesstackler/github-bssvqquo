import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

// Initialize Stripe
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// Create a checkout session directly with Stripe
export const createCheckoutSession = async (priceId: string) => {
  try {
    const stripe = await getStripe();
    if (!stripe) throw new Error('Stripe failed to initialize');

    const { error } = await stripe.redirectToCheckout({
      mode: 'subscription',
      lineItems: [{ price: priceId, quantity: 1 }],
      successUrl: `${window.location.origin}/settings/billing?success=true`,
      cancelUrl: `${window.location.origin}/settings/billing?canceled=true`,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create checkout session');
  }
};

// Create a Stripe Customer Portal session
export const createCustomerPortal = async (customerId: string) => {
  try {
    const stripe = await getStripe();
    if (!stripe) throw new Error('Stripe failed to initialize');

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${window.location.origin}/settings/billing`,
    });

    window.location.href = session.url;
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create customer portal session');
  }
};

// List customer payment methods
export const listPaymentMethods = async (customerId: string) => {
  try {
    const stripe = await getStripe();
    if (!stripe) throw new Error('Stripe failed to initialize');

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return paymentMethods.data;
  } catch (error) {
    console.error('Error listing payment methods:', error);
    return [];
  }
};

// Delete a payment method
export const deletePaymentMethod = async (paymentMethodId: string) => {
  try {
    const stripe = await getStripe();
    if (!stripe) throw new Error('Stripe failed to initialize');

    await stripe.paymentMethods.detach(paymentMethodId);
    return true;
  } catch (error) {
    console.error('Error deleting payment method:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete payment method');
  }
};

// Add a new payment method
export const addPaymentMethod = async (paymentMethodId: string, customerId: string) => {
  try {
    const stripe = await getStripe();
    if (!stripe) throw new Error('Stripe failed to initialize');

    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    return true;
  } catch (error) {
    console.error('Error adding payment method:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to add payment method');
  }
};

// Update default payment method
export const updateDefaultPaymentMethod = async (customerId: string, paymentMethodId: string) => {
  try {
    const stripe = await getStripe();
    if (!stripe) throw new Error('Stripe failed to initialize');

    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return true;
  } catch (error) {
    console.error('Error updating default payment method:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update default payment method');
  }
};