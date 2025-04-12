import React from 'react';
import { Clock, FileText, CheckCircle2 } from 'lucide-react';

interface PartnerResponseProps {
  partnerId: string;
  partnerName: string;
  responseRate: number;
  averageResponseTime: number;
  totalResponses: number;
  totalLeads: number;
  lastResponseTime?: Date;
}

export function PartnerResponseCard({
  partnerId,
  partnerName,
  responseRate,
  averageResponseTime,
  totalResponses,
  totalLeads,
  lastResponseTime
}: PartnerResponseProps) {
  // Determine the response rate color
  const getRateColor = () => {
    if (responseRate >= 90) return 'text-green-700';
    if (responseRate >= 70) return 'text-yellow-700';
    return 'text-red-700';
  };

  // Determine the response time color
  const getTimeColor = () => {
    if (averageResponseTime <= 1) return 'text-green-700';
    if (averageResponseTime <= 4) return 'text-yellow-700';
    return 'text-red-700';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-medium text-gray-900">{partnerName}</h3>
        <div className={`text-lg font-bold ${getRateColor()}`}>
          {responseRate}%
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 flex items-center">
            <Clock className="w-4 h-4 mr-1.5" />
            Avg. Response Time
          </div>
          <div className={`text-sm font-medium ${getTimeColor()}`}>
            {averageResponseTime.toFixed(1)} hours
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 flex items-center">
            <FileText className="w-4 h-4 mr-1.5" />
            Leads Processed
          </div>
          <div className="text-sm font-medium text-gray-700">
            {totalResponses} / {totalLeads} ({totalLeads > 0 ? Math.round((totalResponses / totalLeads) * 100) : 0}%)
          </div>
        </div>

        {lastResponseTime && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Last Response
            </div>
            <div className="text-sm font-medium text-gray-700">
              {lastResponseTime.toLocaleString()}
            </div>
          </div>
        )}

        {/* Progress bar for response rate */}
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full ${
                responseRate >= 90 ? 'bg-green-500' : 
                responseRate >= 70 ? 'bg-yellow-500' : 
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, responseRate)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}