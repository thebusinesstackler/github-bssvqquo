import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { useLeadStore } from '../../store/useLeadStore';
import { AlertCircle, CheckCircle, MapPin } from 'lucide-react';

interface AddPatientFormProps {
  onClose: () => void;
}

interface Site {
  id: string;
  name: string;
  zipCode: string;
  radius: number; // in miles
}

function calculateDistance(zipCode1: string, zipCode2: string): number {
  // This is a simplified version - in production you'd want to use a proper geocoding service
  // For now, we'll just compare the first 3 digits of the zip codes
  // as a rough approximation of geographic proximity
  const prefix1 = zipCode1.substring(0, 3);
  const prefix2 = zipCode2.substring(0, 3);
  
  // Return a rough estimate - same prefix means very close
  if (prefix1 === prefix2) return 0;
  
  // Different prefixes - calculate a rough distance
  // This is just for demonstration - real implementation would use actual geocoding
  return Math.abs(parseInt(prefix1) - parseInt(prefix2)) * 10;
}

export function AddPatientForm({ onClose }: AddPatientFormProps) {
  const { partners } = useAdminStore();
  const { addLead } = useLeadStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [suggestedSite, setSuggestedSite] = useState<Site | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    sex: 'male',
    phone: '',
    email: '',
    zipCode: '',
    indication: '',
    partnerId: '',
    status: 'new' as const
  });

  // Get all sites with their radius settings
  const sites = partners.map(partner => ({
    id: partner.id,
    name: partner.name,
    zipCode: partner.siteDetails?.zipCode || '',
    radius: partner.siteDetails?.radius || 25 // default 25 mile radius
  }));

  // When zipcode changes, find the closest site within radius
  useEffect(() => {
    if (formData.zipCode.length === 5) {
      const matchingSites = sites.filter(site => {
        if (!site.zipCode) return false;
        const distance = calculateDistance(formData.zipCode, site.zipCode);
        return distance <= site.radius;
      });

      // Sort by distance and get the closest
      if (matchingSites.length > 0) {
        const closest = matchingSites.sort((a, b) => 
          calculateDistance(formData.zipCode, a.zipCode) - 
          calculateDistance(formData.zipCode, b.zipCode)
        )[0];

        setSuggestedSite(closest);
        setFormData(prev => ({ ...prev, partnerId: closest.id }));
      } else {
        setSuggestedSite(null);
        setFormData(prev => ({ ...prev, partnerId: '' }));
      }
    }
  }, [formData.zipCode]);

  const validateZipCode = (zipCode: string) => {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zipCode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate zipcode
    if (!validateZipCode(formData.zipCode)) {
      setError('Please enter a valid ZIP code');
      return;
    }

    // Ensure a site was matched
    if (!formData.partnerId) {
      setError('No matching site found for this ZIP code');
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
      setError(err instanceof Error ? err.message : 'Failed to add patient');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Add New Patient</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
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
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Sex
            </label>
            <select
              name="sex"
              value={formData.sex}
              onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
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
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              placeholder="12345"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Indication
            </label>
            <input
              type="text"
              name="indication"
              required
              value={formData.indication}
              onChange={(e) => setFormData({ ...formData, indication: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="e.g., Type 2 Diabetes"
            />
          </div>
        </div>

        {/* Site Assignment Section */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Site Assignment</h3>
          
          {formData.zipCode.length === 5 ? (
            suggestedSite ? (
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-green-500 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Suggested Site: {suggestedSite.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    This site is within {suggestedSite.radius} miles of the patient's location
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    No sites found within range
                  </p>
                  <p className="text-sm text-gray-500">
                    Consider manually assigning to the nearest site
                  </p>
                </div>
              </div>
            )
          ) : (
            <p className="text-sm text-gray-500">
              Enter a ZIP code to see suggested sites
            </p>
          )}

          {/* Manual Site Selection */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Assign to Site
            </label>
            <select
              value={formData.partnerId}
              onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select a site...</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>
                  {site.name} {site === suggestedSite ? '(Suggested)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 p-3 rounded-md flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Patient added successfully!
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isLoading || !formData.partnerId}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Adding...' : 'Add Patient'}
          </button>
        </div>
      </form>
    </div>
  );
}