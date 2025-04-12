import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useLeadStore } from '../store/useLeadStore';
import { useAdminStore } from '../store/useAdminStore';
import { X, AlertCircle, CheckCircle, User, Mail, Phone, Building2, FileText, Link, MapPin, Ruler } from 'lucide-react';
import { findNearestPartner } from '../lib/zipCodeUtils';

interface AddNewLeadFormProps {
  onClose: () => void;
  standalone?: boolean;
}

export function AddNewLeadForm({ onClose, standalone = false }: AddNewLeadFormProps) {
  const { user, impersonatedUser } = useAuthStore();
  const { addLead } = useLeadStore();
  const { partners, fetchPartners } = useAdminStore();
  const effectiveUser = impersonatedUser || user;
  const isAdmin = user?.role === 'admin';
  const [autoAssignment, setAutoAssignment] = useState(true);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    zipCode: '',
    companyName: '',
    indication: '',
    source: '',
    notes: '',
    status: 'new' as const,
    quality: 'warm' as const,
    partnerId: effectiveUser?.id || ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [nearestPartner, setNearestPartner] = useState<{id: string, name: string, distance: number} | null>(null);

  // Fetch partners for admin users
  useEffect(() => {
    if (isAdmin && partners.length === 0) {
      fetchPartners();
    }
  }, [isAdmin, partners.length, fetchPartners]);

  // When zip code changes, find the nearest partner automatically
  useEffect(() => {
    const findNearest = async () => {
      if (isAdmin && formData.zipCode && formData.zipCode.length === 5 && autoAssignment) {
        const activePartners = partners.filter(p => p.active);
        const nearest = await findNearestPartner(formData.zipCode, activePartners);
        
        if (nearest) {
          setNearestPartner({
            id: nearest.partner.id,
            name: nearest.partner.name,
            distance: nearest.distance
          });
          
          // Automatically set the partner
          setFormData(prev => ({
            ...prev,
            partnerId: nearest.partner.id
          }));
        } else {
          setNearestPartner(null);
        }
      }
    };
    
    findNearest();
  }, [formData.zipCode, partners, isAdmin, autoAssignment]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName) {
      setError('Please enter the lead\'s name');
      return false;
    }
    
    if (!formData.email && !formData.phone) {
      setError('Please provide either an email or phone number');
      return false;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.phone && !/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/\s+/g, ''))) {
      setError('Please enter a valid phone number');
      return false;
    }

    if (isAdmin && !formData.partnerId) {
      setError('Please select a partner to assign this lead to');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      if (!effectiveUser?.id) {
        throw new Error('User not authenticated');
      }

      // Set the partnerId to the current user's ID if not an admin
      const partnerId = isAdmin ? formData.partnerId : effectiveUser.id;

      console.log('Adding lead with data:', {
        ...formData,
        partnerId,
      });
      
      // Add the lead to Firebase
      await addLead({
        ...formData,
        partnerId,
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error adding lead:', err);
      setError(err instanceof Error ? err.message : 'Failed to add lead');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-xl ${standalone ? '' : 'max-w-2xl w-full mx-4'}`}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Add New Lead</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="firstName"
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="lastName"
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Smith"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="john.smith@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="zipCode"
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="12345"
                    maxLength={5}
                  />
                </div>
                {nearestPartner && (
                  <p className="mt-1 text-xs text-green-600">
                    Nearest partner: {nearestPartner.name} ({Math.round(nearestPartner.distance)} miles away)
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name (if applicable)
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="companyName"
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Acme Corporation"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
                  Lead Source
                </label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="source"
                    type="text"
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Website, Referral, etc."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Information */}
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-4">Clinical Information</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="indication" className="block text-sm font-medium text-gray-700 mb-1">
                  Indication / Condition
                </label>
                <input
                  id="indication"
                  type="text"
                  name="indication"
                  value={formData.indication}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Type 2 Diabetes"
                />
              </div>
              
              {isAdmin && (
                <>
                  <div className="flex items-center">
                    <input
                      id="autoAssign"
                      type="checkbox"
                      checked={autoAssignment}
                      onChange={() => setAutoAssignment(!autoAssignment)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="autoAssign" className="ml-2 block text-sm text-gray-700">
                      Automatically assign to nearest partner based on ZIP code
                    </label>
                  </div>
                  
                  {!autoAssignment && (
                    <div>
                      <label htmlFor="partnerId" className="block text-sm font-medium text-gray-700 mb-1">
                        Assign to Partner<span className="text-red-500">*</span>
                      </label>
                      <select
                        id="partnerId"
                        name="partnerId"
                        value={formData.partnerId}
                        onChange={handleChange}
                        required={isAdmin}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select a partner</option>
                        {partners.filter(p => p.active).map(partner => (
                          <option key={partner.id} value={partner.id}>
                            {partner.name} - {partner.siteDetails?.city || 'Unknown location'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes / Comments
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add any relevant notes or comments about this lead..."
              />
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
              Lead added successfully!
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}