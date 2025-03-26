import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLeadStore } from '../store/useLeadStore';
import { formatDistanceToNow } from 'date-fns';
import {
  User,
  Phone,
  Clock,
  AlertCircle,
  MessageSquare,
  ChevronLeft,
  FileText,
  Calendar
} from 'lucide-react';

export function LeadDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const lead = useLeadStore((state) => state.leads.find(l => l.id === id));
  const updateLeadStatus = useLeadStore((state) => state.updateLeadStatus);

  if (!lead) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">Lead not found</h2>
        <button
          onClick={() => navigate('/leads')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Return to Leads
        </button>
      </div>
    );
  }

  const handleStatusChange = (newStatus: string) => {
    updateLeadStatus(lead.id, newStatus as any);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/leads')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Leads
        </button>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/messages')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Send Message
          </button>
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Phone className="w-4 h-4 mr-2" />
            Call Patient
          </button>
        </div>
      </div>

      {/* Lead Details Card */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{lead.patientName}</h1>
              <p className="text-gray-500">{lead.condition}</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={lead.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="new">New</option>
                <option value="leftVoicemail">Left Voicemail</option>
                <option value="contacted">Contacted</option>
                <option value="randomized">Randomized</option>
              </select>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center text-gray-600">
                <User className="w-5 h-5 mr-3" />
                <div>
                  <p className="text-sm font-medium">Contact Information</p>
                  <p className="text-gray-900">{lead.contactInfo}</p>
                </div>
              </div>
              <div className="flex items-center text-gray-600">
                <AlertCircle className="w-5 h-5 mr-3" />
                <div>
                  <p className="text-sm font-medium">Priority</p>
                  <p className="text-gray-900 capitalize">{lead.priority}</p>
                </div>
              </div>
              <div className="flex items-center text-gray-600">
                <Calendar className="w-5 h-5 mr-3" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-gray-900">
                    {formatDistanceToNow(lead.createdAt, { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center text-gray-600">
                <Clock className="w-5 h-5 mr-3" />
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-gray-900">
                    {formatDistanceToNow(lead.lastUpdated, { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex items-center text-gray-600">
                <MessageSquare className="w-5 h-5 mr-3" />
                <div>
                  <p className="text-sm font-medium">Messages</p>
                  <p className="text-gray-900">{lead.messages.length} messages</p>
                </div>
              </div>
              {lead.expiresAt && (
                <div className="flex items-center text-gray-600">
                  <Clock className="w-5 h-5 mr-3" />
                  <div>
                    <p className="text-sm font-medium">Expires</p>
                    <p className="text-gray-900">
                      {formatDistanceToNow(lead.expiresAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div className="mt-8">
            <div className="flex items-center mb-4">
              <FileText className="w-5 h-5 mr-2 text-gray-500" />
              <h2 className="text-lg font-semibold">Notes</h2>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">{lead.notes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Activity Timeline</h2>
        <div className="space-y-4">
          {lead.messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  Message {message.senderId === 'p1' ? 'Sent' : 'Received'}
                </p>
                <p className="text-sm text-gray-500">{message.content}</p>
                <p className="text-xs text-gray-400">
                  {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}