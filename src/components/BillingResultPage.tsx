import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { loadStripe } from '@stripe/stripe-js';
import { CheckCircle2, XCircle, Loader2, ArrowRight, Lock, CreditCard, Calendar, Building2 } from 'lucide-react';

interface SubscriptionDetails {
  subscriptionId: string;
  customerId: string;
  status: string;
  currentPeriodEnd: number;
  plan: string;
  amount: number;
  maxLeads: number;
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function BillingResultPage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);

  useEffect(() => {
    const handlePaymentResult = async () => {
      // Check for different payment flow parameters
      const sessionId = searchParams.get('session_id');
      const paymentIntentId = searchParams.get('payment_intent');
      const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
      const canceled = searchParams.get('canceled');
      const redirect_status = searchParams.get('redirect_status');

      if (canceled) {
        setStatus('error');
        setError('Payment was canceled');
        return;
      }

      // Handle redirect_status from Payment Element flow
      if (redirect_status === 'failed') {
        setStatus('error');
        setError('Payment failed. Please try again.');
        return;
      }

      if (!navigator.onLine) {
        setStatus('error');
        setError('No internet connection. Please check your network and try again.');
        return;
      }

      try {
        // Get the auth token
        const token = await user?.getIdToken();
        if (!token) {
          throw new Error('Authentication required');
        }

        let endpoint;
        let requestBody;

        // Determine which API endpoint to call based on available parameters
        if (sessionId) {
          endpoint = 'getStripeSubscription';
          requestBody = { sessionId };
        } else if (paymentIntentId) {
          endpoint = 'handlePaymentSuccess';
          requestBody = { paymentIntentId };
        } else if (paymentIntentClientSecret) {
          // If we have a client secret, verify the payment intent status
          const stripe = await stripePromise;
          if (!stripe) throw new Error('Failed to load Stripe');

          const { paymentIntent } = await stripe.retrievePaymentIntent(paymentIntentClientSecret);
          
          if (!paymentIntent) {
            throw new Error('Payment verification failed');
          }

          switch (paymentIntent.status) {
            case 'succeeded':
              endpoint = 'handlePaymentSuccess';
              requestBody = { paymentIntentId: paymentIntent.id };
              break;
            case 'processing':
              setStatus('loading');
              setError('Your payment is still processing. We will notify you when it completes.');
              return;
            case 'requires_payment_method':
              setStatus('error');
              setError('Payment failed. Please try another payment method.');
              return;
            default:
              setStatus('error');
              setError('Something went wrong with your payment. Please try again.');
              return;
          }
        } else {
          setStatus('error');
          setError('Invalid payment session');
          return;
        }

        // Make the API call
        const response = await fetch(
          `${import.meta.env.VITE_FIREBASE_FUNCTIONS_URL}/${endpoint}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process payment');
        }

        const subscriptionData = await response.json();
        if (subscriptionData.success && subscriptionData.subscription) {
          setSubscriptionDetails(subscriptionData.subscription);
          setStatus('success');
        } else {
          throw new Error('Invalid subscription data received');
        }
      } catch (err) {
        console.error('Error processing payment result:', err);
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to process payment');
      }
    };

    handlePaymentResult();
  }, [searchParams, user]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {status === 'loading' && (
          <div className="text-center">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Processing your payment...
              </h2>
              <p className="text-gray-600">
                Please wait while we confirm your subscription.
              </p>
            </div>
          </div>
        )}

        {status === 'success' && subscriptionDetails && (
          <div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Success Header */}
              <div className="bg-green-50 px-6 py-8 sm:p-10 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Payment Successful!
                </h2>
                <p className="text-gray-600">
                  Thank you for subscribing to {subscriptionDetails.plan}
                </p>
              </div>

              {/* Subscription Details */}
              <div className="px-6 py-8 sm:p-10">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Subscription Details</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <div className="flex items-center">
                      <Building2 className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Plan</p>
                        <p className="text-sm text-gray-500">{subscriptionDetails.plan}</p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatAmount(subscriptionDetails.amount)}/month
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <div className="flex items-center">
                      <CreditCard className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Subscription Status</p>
                        <p className="text-sm text-gray-500 capitalize">{subscriptionDetails.status}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Next Billing Date</p>
                        <p className="text-sm text-gray-500">{formatDate(subscriptionDetails.currentPeriodEnd)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Lock className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Lead Limit</p>
                        <p className="text-sm text-gray-500">{subscriptionDetails.maxLeads} leads per month</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-gray-50 px-6 py-8 sm:p-10">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-5 h-5" />
                </button>
                <p className="mt-4 text-sm text-center text-gray-500">
                  You can manage your subscription anytime from the settings page
                </p>
              </div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Payment Failed
            </h2>
            <p className="text-gray-600 mb-6">
              {error || 'There was an error processing your payment.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/pricing')}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/support')}
                className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Contact Support
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { BillingResultPage }