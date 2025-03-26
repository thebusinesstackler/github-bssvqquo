import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useLeadStore } from '../store/useLeadStore';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Clock,
  PhoneCall,
  CheckCircle2,
  Settings,
  FileText,
  Building2,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  UserPlus,
  BellRing,
  MessageSquare
} from 'lucide-react';

export function PartnerDashboard() {
  const navigate = useNavigate();
  const { user, impersonatedUser } = useAuthStore();
  const effectiveUser = impersonatedUser || user;
  const { leads, fetchLeads, isLoading, error } = useLeadStore();

  useEffect(() => {
    if (effectiveUser?.id) {
      fetchLeads(effectiveUser.id);
    }
  }, [effectiveUser?.id]);

  // Show welcome message for new partners with no leads
  if (!isLoading && leads.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg">
              <BellRing className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Welcome to Accelerate Trials!
          </h1>
          <p className="text-lg text-center text-gray-600 mb-8">
            Let's get your research site set up and ready to receive patient referrals
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Complete Your Profile</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <Building2 className="w-5 h-5 text-blue-600 mt-1 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Site Information</p>
                  <p className="text-sm text-gray-600">Add your research site details, location, and contact information</p>
                </div>
              </div>
              <div className="flex items-start">
                <Users className="w-5 h-5 text-blue-600 mt-1 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Team Members</p>
                  <p className="text-sm text-gray-600">Add your principal investigator and study coordinators</p>
                </div>
              </div>
              <div className="flex items-start">
                <FileText className="w-5 h-5 text-blue-600 mt-1 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Study Protocols</p>
                  <p className="text-sm text-gray-600">Configure your active studies and enrollment criteria</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/settings')}
                className="w-full mt-4 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Settings className="w-5 h-5 mr-2" />
                Edit Profile
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <MessageSquare className="w-5 h-5 text-green-600 mt-1 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Enable Notifications</p>
                  <p className="text-sm text-gray-600">Set up alerts for new patient referrals and messages</p>
                </div>
              </div>
              <div className="flex items-start">
                <UserPlus className="w-5 h-5 text-green-600 mt-1 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Invite Team Members</p>
                  <p className="text-sm text-gray-600">Add your colleagues to collaborate on patient referrals</p>
                </div>
              </div>
              <div className="flex items-start">
                <Calendar className="w-5 h-5 text-green-600 mt-1 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Schedule Training</p>
                  <p className="text-sm text-gray-600">Book a session with our team to learn the platform</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/support')}
                className="w-full mt-4 flex items-center justify-center px-4 py-2 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                View Getting Started Guide
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h2>
          <p className="text-gray-600 mb-4">
            Our support team is available 24/7 to help you get the most out of Accelerate Trials.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <FileText className="w-5 h-5 text-blue-600 mr-2" />
              View Documentation
            </button>
            <button className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <MessageSquare className="w-5 h-5 text-blue-600 mr-2" />
              Chat with Support
            </button>
            <button className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Calendar className="w-5 h-5 text-blue-600 mr-2" />
              Schedule Demo
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center">
        <AlertCircle className="w-5 h-5 mr-2" />
        {error}
      </div>
    );
  }

  // Calculate statistics
  const totalLeads = leads.length;
  const newLeads = leads.filter(lead => lead.status === 'new').length;
  const contactedLeads = leads.filter(lead => lead.status === 'contacted').length;
  const convertedLeads = leads.filter(lead => lead.status === 'converted').length;
  const responseRate = totalLeads ? Math.round((contactedLeads / totalLeads) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partner Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {effectiveUser?.name}
          </p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <FileText className="w-5 h-5 mr-2" />
          Download Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-2xl font-semibold text-gray-900">{totalLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <PhoneCall className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Response Rate</p>
              <p className="text-2xl font-semibold text-gray-900">{responseRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-semibold text-gray-900">2.5h</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full">
              <CheckCircle2 className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Converted</p>
              <p className="text-2xl font-semibold text-gray-900">{convertedLeads}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {leads.slice(0, 5).map((lead) => (
            <div key={lead.id} className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {lead.firstName} {lead.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{lead.indication}</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(lead.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Subscription Plan</h3>
            <div className="mt-2 flex items-center">
              <DollarSign className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-lg font-medium text-gray-900">
                {effectiveUser?.subscription || 'Professional'}
              </span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Next Billing Date</h3>
            <div className="mt-2 flex items-center">
              <Calendar className="w-5 h-5 text-blue-500 mr-2" />
              <span className="text-lg font-medium text-gray-900">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Lead Quota</h3>
            <div className="mt-2 flex items-center">
              <TrendingUp className="w-5 h-5 text-purple-500 mr-2" />
              <span className="text-lg font-medium text-gray-900">
                {totalLeads} / {effectiveUser?.maxLeads || 100} leads
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}