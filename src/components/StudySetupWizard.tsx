import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtocolUpload } from './ProtocolUpload';
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
  CreditCard,
  Lock,
  Upload
} from 'lucide-react';

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

interface PricingPlan {
  name: string;
  price: number;
  features: string[];
  recommended: boolean;
  leadLimit: number;
  supportLevel: string;
}

interface PaymentDetails {
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvc: string;
}

const PRICING_PLANS: PricingPlan[] = [
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
    leadLimit: -1, // Unlimited
    supportLevel: 'Premium'
  }
];

export function StudySetupWizard() {
  const navigate = useNavigate();
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
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvc: ''
  });
  const [showProtocolUpload, setShowProtocolUpload] = useState(false);
  const [generatedFields, setGeneratedFields] = useState<any[]>([]);

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

  const addCriteria = (type: 'inclusion' | 'exclusion') => {
    setStudyDetails(prev => ({
      ...prev,
      [type === 'inclusion' ? 'inclusionCriteria' : 'exclusionCriteria']: [
        ...prev[type === 'inclusion' ? 'inclusionCriteria' : 'exclusionCriteria'],
        ''
      ]
    }));
  };

  const updateCriteria = (type: 'inclusion' | 'exclusion', index: number, value: string) => {
    setStudyDetails(prev => ({
      ...prev,
      [type === 'inclusion' ? 'inclusionCriteria' : 'exclusionCriteria']: prev[
        type === 'inclusion' ? 'inclusionCriteria' : 'exclusionCriteria'
      ].map((criteria, i) => (i === index ? value : criteria))
    }));
  };

  const removeCriteria = (type: 'inclusion' | 'exclusion', index: number) => {
    setStudyDetails(prev => ({
      ...prev,
      [type === 'inclusion' ? 'inclusionCriteria' : 'exclusionCriteria']: prev[
        type === 'inclusion' ? 'inclusionCriteria' : 'exclusionCriteria'
      ].filter((_, i) => i !== index)
    }));
  };

  const addCoordinator = () => {
    setStudyDetails(prev => ({
      ...prev,
      siteDetails: {
        ...prev.siteDetails,
        coordinators: [...prev.siteDetails.coordinators, '']
      }
    }));
  };

  const updateCoordinator = (index: number, value: string) => {
    setStudyDetails(prev => ({
      ...prev,
      siteDetails: {
        ...prev.siteDetails,
        coordinators: prev.siteDetails.coordinators.map((coord, i) => 
          i === index ? value : coord
        )
      }
    }));
  };

  const removeCoordinator = (index: number) => {
    setStudyDetails(prev => ({
      ...prev,
      siteDetails: {
        ...prev.siteDetails,
        coordinators: prev.siteDetails.coordinators.filter((_, i) => i !== index)
      }
    }));
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

  const handleSubmit = () => {
    if (!selectedPlan) {
      setError('Please select a plan to continue');
      return;
    }

    // Navigate to settings page after successful setup
    navigate('/settings');
  };

  const handleProtocolSuccess = (fields: any[]) => {
    setGeneratedFields(fields);
    // Update study details with AI-generated fields
    setStudyDetails(prev => ({
      ...prev,
      inclusionCriteria: fields
        .filter(f => f.category === 'eligibility' && f.type === 'checkbox')
        .map(f => f.label),
      exclusionCriteria: fields
        .filter(f => f.category === 'medical' && f.type === 'radio')
        .map(f => f.label)
    }));
  };

  const recommendedPlan = PRICING_PLANS.find(plan => 
    plan.leadLimit >= studyDetails.targetEnrollment
  ) || PRICING_PLANS[PRICING_PLANS.length - 1];

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

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Inclusion Criteria</label>
                  <button
                    type="button"
                    onClick={() => addCriteria('inclusion')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add Criteria
                  </button>
                </div>
                {studyDetails.inclusionCriteria.map((criteria, index) => (
                  <div key={index} className="mt-2 flex items-center space-x-2">
                    <input
                      type="text"
                      value={criteria}
                      onChange={(e) => updateCriteria('inclusion', index, e.target.value)}
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter inclusion criteria"
                    />
                    <button
                      type="button"
                      onClick={() => removeCriteria('inclusion', index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Exclusion Criteria</label>
                  <button
                    type="button"
                    onClick={() => addCriteria('exclusion')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add Criteria
                  </button>
                </div>
                {studyDetails.exclusionCriteria.map((criteria, index) => (
                  <div key={index} className="mt-2 flex items-center space-x-2">
                    <input
                      type="text"
                      value={criteria}
                      onChange={(e) => updateCriteria('exclusion', index, e.target.value)}
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter exclusion criteria"
                    />
                    <button
                      type="button"
                      onClick={() => removeCriteria('exclusion', index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
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

              <div className="col-span-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Study Coordinators</label>
                  <button
                    type="button"
                    onClick={addCoordinator}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add Coordinator
                  </button>
                </div>
                {studyDetails.siteDetails.coordinators.map((coordinator, index) => (
                  <div key={index} className="mt-2 flex items-center space-x-2">
                    <input
                      type="text"
                      value={coordinator}
                      onChange={(e) => updateCoordinator(index, e.target.value)}
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter coordinator name"
                    />
                    <button
                      type="button"
                      onClick={() => removeCoordinator(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
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
              {PRICING_PLANS.map((plan) => (
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
                    onClick={() => setSelectedPlan(plan.name)}
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

            {recommendedPlan && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <Star className="w-5 h-5 text-blue-600 mt-1 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Based on your target enrollment of {studyDetails.targetEnrollment} participants,
                      we recommend the {recommendedPlan.name} plan.
                    </p>
                    <p className="mt-1 text-sm text-blue-700">
                      This plan includes {recommendedPlan.leadLimit === -1 ? 'unlimited' : recommendedPlan.leadLimit} leads
                      and {recommendedPlan.supportLevel} support to help you meet your recruitment goals.
                    </p>
                  </div>
                </div>
              </div>
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

      {/* Protocol Upload Modal */}
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