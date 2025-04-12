import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Loader, Flame, Thermometer, Snowflake } from 'lucide-react';
import { Partner, Lead, LeadQuality } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';

interface LeadAssignmentModalProps {
  lead: Lead | null; // null for new lead, Lead object for reassignment
  partners: Partner[];
  onClose: () => void;
  onAssign: (leadId: string, partnerId: string, reason?: string) => Promise<void>;
}

export function LeadAssignmentModal({ lead, partners, onClose, onAssign }: LeadAssignmentModalProps) {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    firstName: lead?.firstName || '',
    lastName: lead?.lastName || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    indication: lead?.indication || '',
    partnerId: lead?.partnerId || '',
    quality: lead?.quality || 'warm' as LeadQuality,
    reassignmentReason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  // Check partner quotas when selected partner changes
  useEffect(() => {
    if (formData.partnerId) {
      const selectedPartner = partners.find(p => p.id === formData.partnerId);
      if (selectedPartner) {
        const quotaPercentage = (selectedPartner.currentLeads / selectedPartner.maxLeads) * 100;
        if (quotaPercentage >= 95) {
          setWarning(`Warning: ${selectedPartner.name}'s lead quota is at ${Math.round(quotaPercentage)}%`);
        } else if (quotaPercentage >= 80) {
          setWarning(`Note: ${selectedPartner.name}'s lead quota is at ${Math.round(quotaPercentage)}%`);
        } else {
          setWarning(null);
        }
      }
    }
  }, [formData.partnerId, partners]);

  const isReassignment = !!lead;
  const title = isReassignment ? 'Reassign Lead' : 'Assign New Lead';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      if (!formData.partnerId) {
        throw new Error('Please select a partner to assign the lead to');
      }

      if (isReassignment) {
        if (!formData.reassignmentReason && formData.partnerId !== lead.partnerId) {
          throw new Error('Please provide a reason for reassignment');
        }
        
        await onAssign(lead.id, formData.partnerId, formData.reassignmentReason || undefined);
      } else {
        // This would be handled differently - for new lead creation
        // You might have a separate function for this
        console.log('Creating new lead', formData);
      }
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Lead Information Section */}
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-4">Lead Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  readOnly={isReassignment}
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    isReassignment ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  readOnly={isReassignment}
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    isReassignment ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  readOnly={isReassignment}
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    isReassignment ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  readOnly={isReassignment}
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    isReassignment ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  required
                />
              </div>
              
              <div className="col-span-2">
                <label htmlFor="indication" className="block text-sm font-medium text-gray-700 mb-1">
                  Indication
                </label>
                <input
                  type="text"
                  id="indication"
                  value={formData.indication}
                  onChange={(e) => setFormData({ ...formData, indication: e.target.value })}
                  readOnly={isReassignment}
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    isReassignment ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  placeholder="e.g., Type 2 Diabetes"
                  required
                />
              </div>
            </div>
          </div>

          {/* Lead Quality Section */}
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-4">Lead Quality</h3>
            <div className="flex space-x-4">
              <label className={`flex-1 border rounded-lg p-4 cursor-pointer ${
                formData.quality === 'hot' ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}>
                <input 
                  type="radio" 
                  name="quality" 
                  value="hot"
                  checked={formData.quality === 'hot'}
                  onChange={() => setFormData({ ...formData, quality: 'hot' })}
                  className="hidden" 
                />
                <div className="flex flex-col items-center">
                  <Flame className="w-8 h-8 text-red-500" />
                  <span className="mt-2 font-medium text-gray-900">Hot</span>
                  <span className="text-xs text-gray-500 mt-1">High potential</span>
                </div>
              </label>
              
              <label className={`flex-1 border rounded-lg p-4 cursor-pointer ${
                formData.quality === 'warm' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300'
              }`}>
                <input 
                  type="radio" 
                  name="quality" 
                  value="warm"
                  checked={formData.quality === 'warm'}
                  onChange={() => setFormData({ ...formData, quality: 'warm' })}
                  className="hidden" 
                />
                <div className="flex flex-col items-center">
                  <Thermometer className="w-8 h-8 text-yellow-500" />
                  <span className="mt-2 font-medium text-gray-900">Warm</span>
                  <span className="text-xs text-gray-500 mt-1">Moderate potential</span>
                </div>
              </label>
              
              <label className={`flex-1 border rounded-lg p-4 cursor-pointer ${
                formData.quality === 'cold' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}>
                <input 
                  type="radio" 
                  name="quality" 
                  value="cold"
                  checked={formData.quality === 'cold'}
                  onChange={() => setFormData({ ...formData, quality: 'cold' })}
                  className="hidden" 
                />
                <div className="flex flex-col items-center">
                  <Snowflake className="w-8 h-8 text-blue-500" />
                  <span className="mt-2 font-medium text-gray-900">Cold</span>
                  <span className="text-xs text-gray-500 mt-1">Low potential</span>
                </div>
              </label>
            </div>
          </div>

          {/* Assignment Section */}
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-4">Partner Assignment</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="partnerId" className="block text-sm font-medium text-gray-700 mb-1">
                  Assign to Partner
                </label>
                <select
                  id="partnerId"
                  value={formData.partnerId}
                  onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a partner...</option>
                  {partners
                    .filter(p => p.active)
                    .sort((a, b) => {
                      // Sort by utilization (ascending)
                      const aUtil = (a.currentLeads / a.maxLeads) * 100;
                      const bUtil = (b.currentLeads / b.maxLeads) * 100;
                      return aUtil - bUtil;
                    })
                    .map(partner => {
                      const utilization = (partner.currentLeads / partner.maxLeads) * 100;
                      const utilText = `${Math.round(utilization)}% (${partner.currentLeads}/${partner.maxLeads})`;
                      const isHigh = utilization >= 90;
                      
                      return (
                        <option key={partner.id} value={partner.id}>
                          {partner.name} - {utilText}
                        </option>
                      );
                    })
                  }
                </select>
                {warning && (
                  <p className="mt-2 text-xs text-yellow-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {warning}
                  </p>
                )}
              </div>

              {isReassignment && formData.partnerId !== lead?.partnerId && (
                <div>
                  <label htmlFor="reassignmentReason" className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Reassignment
                  </label>
                  <textarea
                    id="reassignmentReason"
                    value={formData.reassignmentReason}
                    onChange={(e) => setFormData({ ...formData, reassignmentReason: e.target.value })}
                    rows={3}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Please provide a reason for reassigning this lead..."
                    required
                  />
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader className="animate-spin w-4 h-4" />
                  <span>{isReassignment ? 'Reassigning...' : 'Assigning...'}</span>
                </>
              ) : (
                <>
                  <span>{isReassignment ? 'Reassign Lead' : 'Assign Lead'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}