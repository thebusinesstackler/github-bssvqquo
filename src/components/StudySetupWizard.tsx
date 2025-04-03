import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtocolUpload } from './ProtocolUpload';
import { getAuth } from 'firebase/auth';
import { createSubscription } from '../lib/stripe';
import { StripePaymentForm } from './StripePaymentForm';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { 
  FileText, 
  Users, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  ArrowRight, 
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Shield,
  Star,
  AlertCircle,
  Upload
} from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface StudyDetails {
  protocolNumber: string;
  studyName: string;
  indication: string;
  phase: string;
  targetEnrollment: number;
  startDate: string;
  endDate: string;
  inclusionCriteria: string[];
  exclusionCriteria: string[];
  siteDetails: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    email: string;
    website?: string;
    principalInvestigator: string;
    coordinators: string[];
  };
}

const PRICE_IDS = {
  'Basic': 'price_1R8ncM4Ni6a2sxmWGu3hnPHs',
  'Professional': 'price_1R8ncw4Ni6a2sxmWAI7h3Bgn', 
  'Enterprise': 'price_1R8ndH4Ni6a2sxmW1A9VyiiR'
};

export function StudySetupWizard() {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  const [currentStep, setCurrentStep] = useState(1);
  const [studyDetails, setStudyDetails] = useState<StudyDetails>({
    protocolNumber: '',
    studyName: '',
    indication: '',
    phase: '',
    targetEnrollment: 0,
    startDate: '',
    endDate: '',
    inclusionCriteria: [''],
    exclusionCriteria: [''],
    siteDetails: {
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      email: '',
      principalInvestigator: '',
      coordinators: ['']
    }
  });
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showProtocolUpload, setShowProtocolUpload] = useState(false);
  const [generatedFields, setGeneratedFields] = useState<any[]>([]);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const handleStudyDetailsChange = (field: keyof StudyDetails, value: any) => {
    setStudyDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSiteDetailsChange = (field: keyof StudyDetails['siteDetails'], value: any) => {
    setStudyDetails(prev => ({
      ...prev,
      siteDetails: {
        ...prev.siteDetails,
        [field]: value
      }
    }));
  };

  const handleProtocolSuccess = (fields: any[]) => {
    setGeneratedFields(fields);
    setShowProtocolUpload(false);
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!studyDetails.protocolNumber || !studyDetails.studyName || !studyDetails.indication) {
        setError('Please fill in all required study details');
        return;
      }
    } else if (currentStep === 2) {
      if (!studyDetails.siteDetails.name || !studyDetails.siteDetails.principalInvestigator) {
        setError('Please fill in all required site details');
        return;
      }
    }

    setError(null);
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!selectedPlan) {
      setError('Please select a plan to continue');
      return;
    }

    try {
      const priceId = PRICE_IDS[selectedPlan as keyof typeof PRICE_IDS];
      if (!priceId) {
        throw new Error('Invalid plan selected');
      }

      await createSubscription(priceId);
    } catch (error) {
      console.error('Error creating subscription:', error);
      setError(error instanceof Error ? error.message : 'Failed to create subscription');
    }
  };

  const handlePlanSelect = async (planName: string) => {
    setSelectedPlan(planName);
    setError(null);
  
    try {
      const priceId = PRICE_IDS[planName as keyof typeof PRICE_IDS];
      if (!priceId) {
        throw new Error('Invalid plan selected');
      }
  
      // Get the auth token
      const token = await user?.getIdToken();
      if (!token) {
        throw new Error('Authentication required');
      }
  
      // Create payment intent
      const response = await fetch(`${import.meta.env.VITE_FIREBASE_FUNCTIONS_URL}/createPaymentIntent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }
  
      const { clientSecret } = await response.json();
      setClientSecret(clientSecret);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      setError(error instanceof Error ? error.message : 'Failed to create payment intent');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {['Study Details', 'Site Information', 'Review & Plan'].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep > index + 1 ? 'bg-green-100 text-green-600' :
                currentStep === index + 1 ? 'bg-blue-100 text-blue-600' :
                'bg-gray-100 text-gray-400'
              }`}>
                {currentStep > index + 1 ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep === index + 1 ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {step}
              </span>
              {index < 2 && (
                <div className="mx-4 h-0.5 w-16 bg-gray-200"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Study Details</h2>
              <button
                onClick={() => setShowProtocolUpload(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Protocol
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Protocol Number</label>
                <input
                  type="text"
                  value={studyDetails.protocolNumber}
                  onChange={(e) => handleStudyDetailsChange('protocolNumber', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., ABC-123-456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Study Name</label>
                <input
                  type="text"
                  value={studyDetails.studyName}
                  onChange={(e) => handleStudyDetailsChange('studyName', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter study name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Indication</label>
                <input
                  type="text"
                  value={studyDetails.indication}
                  onChange={(e) => handleStudyDetailsChange('indication', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., Type 2 Diabetes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phase</label>
                <select
                  value={studyDetails.phase}
                  onChange={(e) => handleStudyDetailsChange('phase', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select phase</option>
                  <option value="Phase 1">Phase 1</option>
                  <option value="Phase 2">Phase 2</option>
                  <option value="Phase 3">Phase 3</option>
                  <option value="Phase 4">Phase 4</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Target Enrollment</label>
                <input
                  type="number"
                  value={studyDetails.targetEnrollment}
                  onChange={(e) => handleStudyDetailsChange('targetEnrollment', parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Number of participants"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Study Duration</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={studyDetails.startDate}
                    onChange={(e) => handleStudyDetailsChange('startDate', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={studyDetails.endDate}
                    onChange={(e) => handleStudyDetailsChange('endDate', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Site Information</h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Site Name</label>
                <input
                  type="text"
                  value={studyDetails.siteDetails.name}
                  onChange={(e) => handleSiteDetailsChange('name', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter site name"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  value={studyDetails.siteDetails.address}
                  onChange={(e) => handleSiteDetailsChange('address', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Street address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  value={studyDetails.siteDetails.city}
                  onChange={(e) => handleSiteDetailsChange('city', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <input
                  type="text"
                  value={studyDetails.siteDetails.state}
                  onChange={(e) => handleSiteDetailsChange('state', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                <input
                  type="text"
                  value={studyDetails.siteDetails.zipCode}
                  onChange={(e) => handleSiteDetailsChange('zipCode', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={studyDetails.siteDetails.phone}
                  onChange={(e) => handleSiteDetailsChange('phone', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={studyDetails.siteDetails.email}
                  onChange={(e) => handleSiteDetailsChange('email', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Website (optional)</label>
                <input
                  type="url"
                  value={studyDetails.siteDetails.website}
                  onChange={(e) => handleSiteDetailsChange('website', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="https://"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Principal Investigator</label>
                <input
                  type="text"
                  value={studyDetails.siteDetails.principalInvestigator}
                  onChange={(e) => handleSiteDetailsChange('principalInvestigator', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Review & Select Plan</h2>

            {/* Study Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Study Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Protocol</p>
                  <p className="mt-1">{studyDetails.protocolNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Study Name</p>
                  <p className="mt-1">{studyDetails.studyName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Target Enrollment</p>
                  <p className="mt-1">{studyDetails.targetEnrollment} participants</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Duration</p>
                  <p className="mt-1">{studyDetails.startDate} to {studyDetails.endDate}</p>
                </div>
              </div>
            </div>

            {/* Pricing Plans */}
            <div className="grid grid-cols-3 gap-6">
              {[
                {
                  name: 'Basic',
                  price: 2160,
                  features: [
                    'Up to 50 leads per month',
                    'Basic lead management tools',
                    'Email support',
                    'Standard response time',
                    'Basic analytics'
                  ],
                  recommended: false,
                  leadLimit: 50,
                  supportLevel: 'Standard'
                },
                {
                  name: 'Professional',
                  price: 3650,
                  features: [
                    'Up to 100 leads per month',
                    'Advanced lead management',
                    'Priority support',
                    'Custom integrations',
                    'Advanced analytics',
                    'Dedicated success manager'
                  ],
                  recommended: true,
                  leadLimit: 100,
                  supportLevel: 'Priority'
                },
                {
                  name: 'Enterprise',
                  price: 4400,
                  features: [
                    'Unlimited leads',
                    'Full platform access',
                    '24/7 premium support',
                    'Custom development',
                    'White-label options',
                    'API access'
                  ],
                  recommended: false,
                  leadLimit: -1,
                  supportLevel: 'Premium'
                }
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-lg border ${
                    selectedPlan === plan.name
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200'
                  } p-6 shadow-sm hover:border-blue-300 transition-colors`}
                >
                  {plan.recommended && (
                    <div className="absolute top-0 right-0 -translate-y-1/2 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-full">
                      Recommended
                    </div>
                  )}
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                      <span className="text-gray-500">/month</span>
                    </div>
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
                    onClick={() => handlePlanSelect(plan.name)}
                    className={`mt-6 w-full py-2 px-4 rounded-md ${
                      selectedPlan === plan.name
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {selectedPlan === plan.name ? 'Selected' : 'Select Plan'}
                  </button>
                </div>
              ))}
            </div>

            {/* Stripe Payment Form */}
            {selectedPlan && clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripePaymentForm
                  clientSecret={clientSecret}
                  amount={selectedPlan === 'Basic' ? 2160 : selectedPlan === 'Professional' ? 3650 : 4400}
                  onSuccess={handleSubmit}
                />
              </Elements>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
          )}
          <div className="ml-auto">
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Complete Setup
              </button>
            )}
          </div>
        </div>
      </div>

      {showProtocolUpload && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="max-w-2xl w-full mx-4">
            <ProtocolUpload 
              onSuccess={handleProtocolSuccess}
              onClose={() => setShowProtocolUpload(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}