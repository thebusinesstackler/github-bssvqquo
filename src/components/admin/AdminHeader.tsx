import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Users, FileText, Settings, CreditCard } from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';

export function AdminHeader() {
  const navigate = useNavigate();
  const { adminMetrics } = useAdminStore();
  
  return (
    <div className="bg-white shadow-sm rounded-lg mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-gray-200">
        <div className="bg-white p-6 flex items-center">
          <div className="bg-blue-100 p-3 rounded-full">
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-5">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Total Leads</dt>
              <dd className="text-lg font-semibold text-gray-900">{adminMetrics.totalLeads}</dd>
            </dl>
            <button 
              onClick={() => navigate('/admin/leads')}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
            >
              View all leads
            </button>
          </div>
        </div>
        
        <div className="bg-white p-6 flex items-center">
          <div className="bg-green-100 p-3 rounded-full">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-5">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Active Partners</dt>
              <dd className="text-lg font-semibold text-gray-900">{adminMetrics.activePartners}</dd>
            </dl>
            <button 
              onClick={() => navigate('/admin/partners')}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
            >
              Manage partners
            </button>
          </div>
        </div>
        
        <div className="bg-white p-6 flex items-center">
          <div className="bg-indigo-100 p-3 rounded-full">
            <FileText className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="ml-5">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Response Time</dt>
              <dd className="text-lg font-semibold text-gray-900">{adminMetrics.averageResponseTime}h</dd>
            </dl>
            <button 
              onClick={() => navigate('/admin/partner-leads')}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
            >
              View analytics
            </button>
          </div>
        </div>
        
        <div className="bg-white p-6 flex items-center">
          <div className="bg-yellow-100 p-3 rounded-full">
            <CreditCard className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="ml-5">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Monthly Revenue</dt>
              <dd className="text-lg font-semibold text-gray-900">${adminMetrics.totalRevenue.toLocaleString()}</dd>
            </dl>
            <button 
              onClick={() => navigate('/admin/billing')}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
            >
              Billing dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}