import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Lock } from 'lucide-react';

interface StripePaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
}

export function StripePaymentForm({ clientSecret, amount, onSuccess }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/settings/billing`,
        },
      });

      if (error) {
        setError(error.message || 'An error occurred with your payment');
        setProcessing(false);
        return;
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const PAYMENT_ELEMENT_OPTIONS = {
    layout: 'tabs' as const,
    defaultValues: {
      billingDetails: {
        name: '',
        email: '',
      }
    },
    business: {
      name: 'Accelerate Trials'
    }
  };

  return (
    <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Complete Payment</h3>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">${amount.toFixed(2)}</p>
          <p className="text-sm text-gray-600">/month</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <PaymentElement 
          options={PAYMENT_ELEMENT_OPTIONS}
          onChange={(event) => {
            if (event.error) {
              setError(event.error.message);
            } else {
              setError(null);
            }
          }}
        />

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg flex items-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || processing}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Lock className="w-5 h-5 mr-2" />
          {processing ? 'Processing...' : 'Complete Payment'}
        </button>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-500 flex items-center justify-center">
            <Lock className="w-4 h-4 mr-1" />
            Your payment information is secured with 256-bit encryption
          </p>
          <p className="text-xs text-gray-400">
            By completing this payment, you agree to our terms of service
          </p>
        </div>
      </form>
    </div>
  );
}