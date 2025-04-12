import React, { useState, useEffect } from 'react';
import { X, Clock, AlertCircle, User, FileText, ArrowUpRight, Tangent as Exchange } from 'lucide-react';
import { Lead } from '../../types';
import { useLeadStore } from '../../store/useLeadStore';
import { useAdminStore } from '../../store/useAdminStore';
import { format } from 'date-fns';

interface LeadHistoryModalProps {
  leadId: string;
  onClose: () => void;
}

export function LeadHistoryModal({ leadId, onClose }: LeadHistoryModalProps) {
  const { getLeadHistory } = useLeadStore();
  const { partners } = useAdminStore();
  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState<Lead | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeadHistory = async () => {
      try {
        const leadData = await getLeadHistory(leadId);
        setLead(leadData);
      } catch (err) {
        setError('Failed to fetch lead history');
        console.error('Error fetching lead history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeadHistory();
  }, [leadId, getLeadHistory]);

  const getPartnerName = (partnerId: string) => {
    return partners.find(p => p.id === partnerId)?.name || 'Unknown Partner';
  };

  const getAssignerName = (assignerId: string) => {
    return partners.find(p => p.id === assignerId)?.name || 'System';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Lead History</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 flex flex-col items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading lead history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Lead History</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 flex flex-col items-center justify-center h-48">
            <AlertCircle className="w-10 h-10 text-red-500" />
            <p className="mt-4 text-gray-600">{error || 'Lead not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Lead History: {lead.firstName} {lead.lastName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Lead Basic Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Contact</p>
                <p className="text-sm">{lead.phone}</p>
                <p className="text-sm">{lead.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Current Partner</p>
                <p className="text-sm">{getPartnerName(lead.partnerId)}</p>
              </div>
              {lead.indication && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Indication</p>
                  <p className="text-sm">{lead.indication}</p>
                </div>
              )}
            </div>
          </div>

          {/* Assignment History */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment History</h3>
            {lead.assignmentHistory && lead.assignmentHistory.length > 0 ? (
              <div className="space-y-6">
                {lead.assignmentHistory.map((assignment, index) => (
                  <div key={index} className="relative pl-6 border-l-2 border-gray-200">
                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-blue-500"></div>
                    <div className="mb-2">
                      <div className="text-sm font-medium text-gray-900 flex items-center">
                        {assignment.fromPartnerId ? (
                          <>
                            <Exchange className="w-4 h-4 mr-1 text-blue-500" />
                            <span>Reassigned from {getPartnerName(assignment.fromPartnerId)} to {getPartnerName(assignment.toPartnerId)}</span>
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-4 h-4 mr-1 text-green-500" />
                            <span>Initially assigned to {getPartnerName(assignment.toPartnerId)}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {format(assignment.assignedAt, 'MMM d, yyyy h:mm a')}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <User className="w-3 h-3 mr-1" />
                        Assigned by: {getAssignerName(assignment.assignedBy)}
                      </p>
                    </div>
                    {assignment.reason && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-md mt-2 mb-4">
                        <p className="text-xs font-medium text-gray-500 mb-1">Reason:</p>
                        <p>{assignment.reason}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No assignment history available.</p>
            )}
          </div>

          {/* Status History */}
          {lead.statusHistory && lead.statusHistory.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Status History</h3>
              <div className="space-y-6">
                {lead.statusHistory.map((statusChange, index) => (
                  <div key={index} className="relative pl-6 border-l-2 border-gray-200">
                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-green-500"></div>
                    <div className="mb-2">
                      <div className="text-sm font-medium text-gray-900">
                        Changed to <span className="font-semibold">{statusChange.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {format(statusChange.timestamp, 'MMM d, yyyy h:mm a')}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <User className="w-3 h-3 mr-1" />
                        Updated by: {getAssignerName(statusChange.updatedBy)}
                      </p>
                    </div>
                    {statusChange.notes && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-md mt-2 mb-4">
                        <p className="text-xs font-medium text-gray-500 mb-1">Notes:</p>
                        <p>{statusChange.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {lead.notes && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Notes</h3>
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                <p className="whitespace-pre-wrap">{lead.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}