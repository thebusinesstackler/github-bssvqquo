import React, { useState } from 'react';
import { X, Star, Phone, Mail, Calendar, Clock, Building2, FileText, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { Lead } from '../types';
import { format } from 'date-fns';
import { useLeadStore } from '../store/useLeadStore';

interface LeadDetailsModalProps {
  lead: Lead;
  onClose: () => void;
}

export function LeadDetailsModal({ lead, onClose }: LeadDetailsModalProps) {
  const { updateLeadNotes, updateLeadStatus } = useLeadStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState(lead);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Update lead details
      await updateLeadNotes(lead.id, editedLead.notes || '');
      
      // Update status if changed
      if (editedLead.status !== lead.status) {
        await updateLeadStatus(lead.id, editedLead.status);
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsEditing(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update lead');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editedLead.firstName}
                        onChange={(e) => setEditedLead({ ...editedLead, firstName: e.target.value })}
                        className="border border-gray-300 rounded-md px-2 py-1 mr-2"
                        placeholder="First Name"
                      />
                      <input
                        type="text"
                        value={editedLead.lastName}
                        onChange={(e) => setEditedLead({ ...editedLead, lastName: e.target.value })}
                        className="border border-gray-300 rounded-md px-2 py-1"
                        placeholder="Last Name"
                      />
                    </div>
                  ) : (
                    `${lead.firstName} ${lead.lastName}`
                  )}
                </h2>
                <p className="mt-1 text-gray-500">Lead ID: {lead.id}</p>
              </div>
              {isEditing && (
                <select
                  value={editedLead.status}
                  onChange={(e) => setEditedLead({ ...editedLead, status: e.target.value as any })}
                  className="border border-gray-300 rounded-md px-2 py-1"
                >
                  <option value="new">New</option>
                  <option value="not_contacted">Not Contacted</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                </select>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-gray-400 mr-3" />
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editedLead.phone}
                      onChange={(e) => setEditedLead({ ...editedLead, phone: e.target.value })}
                      className="border border-gray-300 rounded-md px-2 py-1"
                    />
                  ) : (
                    <span>{lead.phone}</span>
                  )}
                </div>
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-gray-400 mr-3" />
                  {isEditing ? (
                    <input
                      type="email"
                      value={editedLead.email}
                      onChange={(e) => setEditedLead({ ...editedLead, email: e.target.value })}
                      className="border border-gray-300 rounded-md px-2 py-1"
                    />
                  ) : (
                    <span>{lead.email}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Study Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Study Information</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-gray-400 mr-3" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedLead.protocol || ''}
                      onChange={(e) => setEditedLead({ ...editedLead, protocol: e.target.value })}
                      className="border border-gray-300 rounded-md px-2 py-1"
                      placeholder="Protocol Number"
                    />
                  ) : (
                    <span>Protocol: {lead.protocol || 'Not assigned'}</span>
                  )}
                </div>
                <div className="flex items-center">
                  <Building2 className="w-5 h-5 text-gray-400 mr-3" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedLead.site || ''}
                      onChange={(e) => setEditedLead({ ...editedLead, site: e.target.value })}
                      className="border border-gray-300 rounded-md px-2 py-1"
                      placeholder="Site Location"
                    />
                  ) : (
                    <span>Site: {lead.site || 'Not assigned'}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                  <span>Created: {format(lead.createdAt, 'MMM d, yyyy h:mm a')}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-gray-400 mr-3" />
                  <span>Last Updated: {format(lead.lastUpdated, 'MMM d, yyyy h:mm a')}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
              {isEditing ? (
                <textarea
                  value={editedLead.notes || ''}
                  onChange={(e) => setEditedLead({ ...editedLead, notes: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add notes about this lead..."
                />
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg">
                  {lead.notes || 'No notes added yet.'}
                </div>
              )}
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-md flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 bg-green-50 text-green-700 p-3 rounded-md flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Lead updated successfully!
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => {
                if (isEditing) {
                  setEditedLead(lead);
                }
                setIsEditing(!isEditing);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
            {isEditing && (
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                <Save className="w-5 h-5 mr-2" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}