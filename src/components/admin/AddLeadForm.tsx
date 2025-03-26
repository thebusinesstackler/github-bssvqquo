import React, { useState } from 'react';
import { useLeadStore } from '../../store/useLeadStore';
import { useAdminStore } from '../../store/useAdminStore';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface AddLeadFormProps {
  onClose: () => void;
}

const STUDIES = [
  {
    id: 'diabetes-001',
    name: 'Type 2 Diabetes Study',
    criteria: {
      minAge: 18,
      maxAge: 75,
      requiredTests: ['A1C', 'Fasting Blood Sugar']
    }
  },
  {
    id: 'depression-001',
    name: 'Major Depression Study',
    criteria: {
      minAge: 21,
      maxAge: 65,
      requiredTests: ['PHQ-9 Score']
    }
  },
  {
    id: 'arthritis-001',
    name: 'Rheumatoid Arthritis Study',
    criteria: {
      minAge: 30,
      maxAge: 80,
      requiredTests: ['RF Factor', 'Anti-CCP']
    }
  }
];

export function AddLeadForm({ onClose }: AddLeadFormProps) {
  const { partners } = useAdminStore();
  const { addLead } = useLeadStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    // Basic Information
    firstName: '',
    lastName: '',
    age: '',
    sex: 'male',
    phone: '',
    email: '',
    zipCode: '',
    
    // Study Information
    selectedStudy: '',
    indication: '',
    partnerId: '',
    status: 'new',
    
    // Study-Specific Questions
    hasRecentA1C: false,
    a1cValue: '',
    onMedication: false,
    currentMedications: '',
    previousTrials: false,
    diagnosisDate: '',
  });

  const validateZipCode = (zipCode: string) => {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zipCode);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleStudySelect = (studyId: string) => {
    const study = STUDIES.find(s => s.id === studyId);
    setFormData(prev => ({
      ...prev,
      selectedStudy: studyId,
      indication: study?.name || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate zipcode
    if (!validateZipCode(formData.zipCode)) {
      setError('Please enter a valid ZIP code');
      return;
    }

    setIsLoading(true);

    try {
      await addLead({
        ...formData,
        age: parseInt(formData.age, 10),
        createdAt: new Date(),
        lastUpdated: new Date()
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add lead');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Add New Lead</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-md font-medium text-gray-700">Basic Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  required
                  min="18"
                  max="120"
                  value={formData.age}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ZIP Code
                </label>
                <input
                  type="text"
                  name="zipCode"
                  required
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder="12345"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-md font-medium text-gray-700">Study Selection</h3>
            <div className="grid grid-cols-1 gap-4">
              {STUDIES.map(study => (
                <div
                  key={study.id}
                  onClick={() => handleStudySelect(study.id)}
                  className={`p-4 border rounded-lg cursor-pointer ${
                    formData.selectedStudy === study.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <h4 className="font-medium text-gray-900">{study.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Age Range: {study.criteria.minAge}-{study.criteria.maxAge}
                  </p>
                  <p className="text-sm text-gray-500">
                    Required Tests: {study.criteria.requiredTests.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 3 && formData.selectedStudy && (
          <div className="space-y-6">
            <h3 className="text-md font-medium text-gray-700">Study-Specific Questions</h3>
            <div className="space-y-4">
              {formData.selectedStudy === 'diabetes-001' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Most Recent A1C Value
                    </label>
                    <input
                      type="number"
                      name="a1cValue"
                      step="0.1"
                      value={formData.a1cValue}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="onMedication"
                        checked={formData.onMedication}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Currently on diabetes medication</span>
                    </label>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Assign to Partner
                </label>
                <select
                  name="partnerId"
                  required
                  value={formData.partnerId}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select a partner...</option>
                  {partners.map(partner => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 p-3 rounded-md flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Lead added successfully!
          </div>
        )}

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : onClose()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>
          
          <button
            type={currentStep === 3 ? 'submit' : 'button'}
            onClick={() => currentStep < 3 && setCurrentStep(currentStep + 1)}
            disabled={isLoading || (currentStep === 2 && !formData.selectedStudy)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {currentStep === 3 
              ? (isLoading ? 'Adding...' : 'Add Lead')
              : 'Next'
            }
          </button>
        </div>
      </form>
    </div>
  );
}