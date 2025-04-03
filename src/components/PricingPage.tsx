import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { StudySetupWizard } from './StudySetupWizard';
import { 
  CreditCard, 
  Download, 
  FileText, 
  Users, 
  MessageSquare, 
  BarChart3, 
  Shield, 
  Star, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
}

interface Receipt {
  id: string;
  date: Date;
  amount: number;
  description: string;
  status: 'paid' | 'pending' | 'failed';
  downloadUrl: string;
}

export default function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const plans = [
    {
      name: 'Basic',
      price: 2160,
      description: 'Perfect for smaller research sites',
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
      description: 'For growing research organizations',
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
      description: 'For large research institutions',
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

  const handleSelectPlan = (planName: string) => {
    setSelectedPlan(planName);
    setShowSetupWizard(true);
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Simulate adding a card
      const newCard: PaymentMethod = {
        id: Math.random().toString(36).substr(2, 9),
        last4: cardDetails.number.slice(-4),
        brand: 'visa',
        expMonth: parseInt(cardDetails.expiry.split('/')[0]),
        expYear: parseInt(cardDetails.expiry.split('/')[1])
      };

      setPaymentMethods([...paymentMethods, newCard]);
      setShowPaymentForm(false);
      setSuccess('Payment method added successfully');
      
      // Clear form
      setCardDetails({
        number: '',
        expiry: '',
        cvc: '',
        name: ''
      });
    } catch (err) {
      setError('Failed to add payment method');
    }
  };

  const formatCardNumber = (input: string) => {
    const numbers = input.replace(/\D/g, '');
    const groups = numbers.match(/.{1,4}/g) || [];
    return groups.join(' ').substr(0, 19);
  };

  const formatExpiry = (input: string) => {
    const numbers = input.replace(/\D/g, '');
    if (numbers.length >= 2) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}`;
    }
    return numbers;
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
        <button
          onClick={() => navigate('/pricing')}
          className="inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Get Started Today
        </button>
      </div>

      {/* Pricing Plans */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {plans.map((plan) => (
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
            <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
            
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
              onClick={() => handleSelectPlan(plan.name)}
              className={`mt-8 w-full py-2 px-4 rounded-md ${
                plan.recommended
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
              }`}
            >
              Get Started
            </button>
          </div>
        ))}
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Payment Methods</h2>
          <button
            onClick={() => setShowPaymentForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Add Payment Method
          </button>
        </div>

        {paymentMethods.length > 0 ? (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <CreditCard className="w-6 h-6 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {method.brand.toUpperCase()} •••• {method.last4}
                    </p>
                    <p className="text-sm text-gray-500">
                      Expires {method.expMonth}/{method.expYear}
                    </p>
                  </div>
                </div>
                <button className="text-red-600 hover:text-red-700 text-sm">
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No payment methods added</p>
        )}

        {/* Add Payment Method Form */}
        {showPaymentForm && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Payment Method</h3>
              
              <form onSubmit={handleAddCard} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardDetails.number}
                    onChange={(e) => setCardDetails({
                      ...cardDetails,
                      number: formatCardNumber(e.target.value)
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={cardDetails.expiry}
                      onChange={(e) => setCardDetails({
                        ...cardDetails,
                        expiry: formatExpiry(e.target.value)
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      CVC
                    </label>
                    <input
                      type="text"
                      value={cardDetails.cvc}
                      onChange={(e) => setCardDetails({
                        ...cardDetails,
                        cvc: e.target.value.replace(/\D/g, '').slice(0, 3)
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="123"
                      maxLength={3}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name on Card
                  </label>
                  <input
                    type="text"
                    value={cardDetails.name}
                    onChange={(e) => setCardDetails({
                      ...cardDetails,
                      name: e.target.value
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="John Smith"
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Card
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Billing History</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receipt
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {receipts.map((receipt) => (
                <tr key={receipt.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {receipt.date.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {receipt.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${receipt.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      receipt.status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : receipt.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a
                      href={receipt.downloadUrl}
                      className="text-blue-600 hover:text-blue-900 flex items-center justify-end"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </div>
  );
}

export { PricingPage }