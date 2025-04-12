import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { StudySetupWizard } from './StudySetupWizard';
import { createSubscription, getStripe } from '../lib/stripe';
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  UserCheck,
  Info
} from 'lucide-react';

// Define the plans with their actual Stripe price IDs
const PRICING_PLANS = [
  {
    name: 'Basic',
    price: 2160,
    priceId: 'price_1R7wg1G6sbu8wJbhoAeBQwTS',  // Basic Price ID
    features: [
      'Up to 50 leads per month',
      'Basic recruitment tools',
      'Essential study management',
      'Standard support',
      'Basic analytics'
    ],
    recommended: false
  },
  {
    name: 'Professional',
    price: 3650,
    priceId: 'price_1R7wgnG6sbu8wJbh87KOeZsT',  // Professional Price ID
    features: [
      'Up to 100 leads per month',
      'Advanced analytics',
      'Priority support',
      'Custom integrations',
      'Dedicated success manager'
    ],
    recommended: true
  },
  {
    name: 'Enterprise',
    price: 4400,
    priceId: 'price_1R7wi7G6sbu8wJbhV4Bn8jpQ',  // Enterprise Price ID
    features: [
      'Unlimited leads',
      'Full platform access',
      '24/7 premium support',
      'Custom development',
      'White-label options'
    ],
    recommended: false
  }
];

export default function PricingPage() {
  const navigate = useNavigate();
  const { user, impersonatedUser } = useAuthStore();
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get the effective user (either impersonated or actual user)
  const effectiveUser = impersonatedUser || user;
  const isAdmin = user?.role === 'admin';
  const isImpersonating = !!impersonatedUser;

  // Cleanup function for subscription listener
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Cleanup subscription listener on unmount
  useEffect(() => {
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [unsubscribe]);

  const handleSelectPlan = async (plan: typeof PRICING_PLANS[0]) => {
    // Clear previous errors and cleanup
    setError(null);
    if (unsubscribe) {
      unsubscribe();
      setUnsubscribe(null);
    }
    
    // Validate user authentication
    if (!user) {
      navigate('/login');
      return;
    }

    // Get the target user ID - this is either the impersonated user (if admin is impersonating)
    // or the actual logged in user
    const targetUserId = impersonatedUser?.id || user.id;
    const targetUserEmail = impersonatedUser?.email || user.email;

    // Validate user ID and email exist
    if (!targetUserId || !targetUserEmail) {
      setError('User information not found. Please log out and log in again.');
      return;
    }

    setSelectedPlan(plan.name);
    setIsLoading(true);

    try {
      // Create checkout session and get unsubscribe function
      const cleanup = await createSubscription(
        targetUserId, 
        plan.priceId,
        isImpersonating ? user.id : undefined
      );

      // Store unsubscribe function for cleanup
      setUnsubscribe(() => cleanup);
    } catch (err) {
      console.error('Error creating subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to process subscription');
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  if (showSetupWizard) {
    return <StudySetupWizard />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Accelerate Your Clinical Trial Recruitment
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Connect with pre-screened, engaged patients and streamline your recruitment process
        </p>
      </div>

      {/* Admin Impersonation Banner */}
      {isAdmin && isImpersonating && (
        <div className="mb-6 bg-blue-50 text-blue-700 p-4 rounded-lg flex items-center">
          <UserCheck className="w-5 h-5 mr-2" />
          <span>
            You are currently managing subscriptions for <strong>{impersonatedUser.name}</strong> as an admin.
            Any subscription you select will be assigned to this partner.
          </span>
        </div>
      )}

      {/* Error Messages (top level) */}
      {error && (
        <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* User authentication check */}
      {!user && (
        <div className="mb-6 bg-yellow-50 text-yellow-700 p-4 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Please log in to subscribe to a plan.
        </div>
      )}

      {/* Pricing Plans */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {PRICING_PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`bg-white rounded-lg shadow-sm border ${
              plan.recommended ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
            } p-6 relative`}
          >
            {plan.recommended && (
              <div className="absolute top-0 right-0 -translate-y-1/2 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-full">
                Recommended
              </div>
            )}

            <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
            <p className="mt-2 text-sm text-gray-500">Perfect for growing research organizations</p>
            
            <div className="mt-4">
              <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
              <span className="text-gray-500">/month</span>
            </div>

            <ul className="mt-6 space-y-4">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-sm text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectPlan(plan)}
              disabled={isLoading || !user}
              className={`mt-8 w-full py-2 px-4 rounded-md ${
                isLoading && selectedPlan === plan.name
                  ? 'bg-gray-400 cursor-not-allowed'
                  : !user
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : plan.recommended
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
              }`}
            >
              {isLoading && selectedPlan === plan.name ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </div>
              ) : !user ? (
                'Login Required'
              ) : isImpersonating ? (
                `Assign to ${impersonatedUser.name}`
              ) : (
                'Get Started'
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Payment Methods */}
      {user && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Payment Methods</h2>
          </div>

          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center text-gray-500">
              <CreditCard className="w-16 h-16 mb-4 text-gray-300" />
              <p>Your payment methods will appear here after checkout</p>
            </div>
          </div>
        </div>
      )}

      {/* Testing Information */}
      <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-6 mb-8">
        <div className="flex items-start">
          <Info className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-medium text-yellow-800 mb-2">Test Mode Information</h3>
            <p className="text-yellow-700 mb-2">
              To test the payment process, use Stripe's test credit card numbers:
            </p>
            <div className="bg-white p-4 rounded border border-yellow-200 mb-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Card Number:</p>
                  <code className="block p-2 bg-gray-100 rounded mt-1">4242 4242 4242 4242</code>
                </div>
                <div>
                  <p className="font-medium">Expiration:</p>
                  <code className="block p-2 bg-gray-100 rounded mt-1">Any future date</code>
                </div>
                <div>
                  <p className="font-medium">CVC:</p>
                  <code className="block p-2 bg-gray-100 rounded mt-1">Any 3 digits</code>
                </div>
                <div>
                  <p className="font-medium">ZIP:</p>
                  <code className="block p-2 bg-gray-100 rounded mt-1">Any 5 digits</code>
                </div>
              </div>
            </div>
            <p className="text-yellow-700 text-sm">
              This test card will successfully complete the payment flow without charging a real card.
            </p>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 text-red-700 p-4 rounded-lg shadow-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="fixed bottom-4 right-4 bg-green-50 text-green-700 p-4 rounded-lg shadow-lg flex items-center">
          <CheckCircle2 className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}

      {/* Debug information - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs">
          <p className="font-medium mb-1">Debug info:</p>
          <div className="grid grid-cols-2 gap-2">
            <p>Actual User ID: {user?.id}</p>
            <p>Actual User Email: {user?.email}</p>
            <p>Actual User Role: {user?.role}</p>
            {impersonatedUser && (
              <>
                <p>Impersonated User ID: {impersonatedUser.id}</p>
                <p>Impersonated User Email: {impersonatedUser.email}</p>
                <p>Impersonated User Name: {impersonatedUser.name}</p>
              </>
            )}
            <p>Is Admin: {isAdmin ? 'Yes' : 'No'}</p>
            <p>Is Impersonating: {isImpersonating ? 'Yes' : 'No'}</p>
            <p>Target User ID: {effectiveUser?.id}</p>
            <p>Target User Email: {effectiveUser?.email}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export { PricingPage }