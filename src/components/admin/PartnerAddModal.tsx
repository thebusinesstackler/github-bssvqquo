import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Building2, 
  Lock, 
  AlertCircle, 
  CheckCircle,
  Eye,
  EyeOff,
  MapPin,
  Ruler,
  WifiOff,
  Loader2
} from 'lucide-react';
import { createPartnerUser } from '../../lib/firebase';
import { useAdminStore } from '../../store/useAdminStore';

interface PartnerAddModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

// Helper function for implementing retry with exponential backoff
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let retries = 0;
  let lastError: any;

  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if it's a network error
      if (error.code === 'auth/network-request-failed') {
        // Exponential backoff
        const delay = initialDelay * Math.pow(2, retries);
        console.log(`Network request failed. Retrying in ${delay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      } else {
        // For non-network errors, don't retry
        throw error;
      }
    }
  }
  
  // If we've exhausted all retries, throw the last error
  throw lastError;
}

export const PartnerAddModal: React.FC<PartnerAddModalProps> = ({ onClose, onSuccess }) => {
  const { fetchPartners } = useAdminStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    siteName: '',
    zipCode: '',
    serviceRadius: 25, // Default radius in miles
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value) || 25 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsNetworkError(false);
    setIsLoading(true);

    try {
      if (!formData.email || !formData.password || !formData.name || !formData.siteName) {
        throw new Error('Please fill in all required fields.');
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      // Create new partner user with retry mechanism
      const partnerData = await withRetry(() => createPartnerUser(
        formData.email, 
        formData.password, 
        formData.name, 
        formData.siteName,
        formData.zipCode,
        formData.serviceRadius
      ));
      
      console.log('Partner created successfully:', partnerData);
      setSuccess(true);
      
      // Refresh partners list after successful creation
      await fetchPartners();
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close modal after delay
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err: any) {
      console.error('Error creating partner:', err);
      
      // Check if it's a network error
      if (err.code === 'auth/network-request-failed') {
        setIsNetworkError(true);
        setError('Network connection error. Please check your internet connection and try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create partner');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Add New Partner</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="pl-10 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                placeholder="John Smith"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="pl-10 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                placeholder="partner@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site Name
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                name="siteName"
                type="text"
                value={formData.siteName}
                onChange={handleChange}
                className="pl-10 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                placeholder="Research Center"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ZIP Code (Service Location)
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                name="zipCode"
                type="text"
                value={formData.zipCode}
                onChange={handleChange}
                className="pl-10 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                placeholder="12345"
                maxLength={5}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Main location for this partner's service area
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Radius (miles)
            </label>
            <div className="relative">
              <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                name="serviceRadius"
                type="number"
                min="1"
                max="500"
                value={formData.serviceRadius}
                onChange={handleNumberChange}
                className="pl-10 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Maximum distance in miles for lead assignments
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                className="pl-10 pr-10 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button // Added focus:outline-none for accessibility
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Password must be at least 6 characters long
            </p>
          </div>

          {isNetworkError && (
            <div className="bg-amber-50 text-amber-700 p-3 rounded-md flex items-center">
              <WifiOff className="w-5 h-5 mr-2" />
              <div>
                <p className="font-medium">Network connection issue</p>
                <p className="text-sm">Please check your internet connection and try again. The system will automatically retry.</p>
              </div>
            </div>
          )}

          {error && !isNetworkError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 p-3 rounded-md flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>Partner created successfully!</span>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5 mr-2" />
                  Creating...
                </>
              ) : (
                'Create Partner'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}