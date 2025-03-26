import React from 'react';
import { 
  Users, 
  Calendar,
  Clock,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';

export function AddLeadInstructions() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Adding a New Lead</h2>
        
        <div className="space-y-6">
          {/* Step 1: Access Lead Form */}
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                1
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Access the Lead Form</h3>
              <p className="mt-1 text-gray-600">
                Click the "Add Lead" button in the top right corner of your leads dashboard.
              </p>
              <div className="mt-3 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center text-sm text-gray-600">
                  <AlertCircle className="w-5 h-5 text-blue-500 mr-2" />
                  <span>Tip: You can also use the keyboard shortcut <kbd className="px-2 py-1 bg-gray-200 rounded">Ctrl/⌘ + N</kbd> to open the new lead form</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Enter Lead Information */}
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                2
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Enter Lead Information</h3>
              <p className="mt-1 text-gray-600">
                Fill in all required information about the potential participant:
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <Users className="w-5 h-5 text-blue-500 mt-1 mr-2" />
                  <div>
                    <p className="font-medium text-gray-900">Basic Information</p>
                    <ul className="mt-1 text-sm text-gray-600 space-y-1">
                      <li>Full Name</li>
                      <li>Date of Birth</li>
                      <li>Gender</li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="w-5 h-5 text-blue-500 mt-1 mr-2" />
                  <div>
                    <p className="font-medium text-gray-900">Contact Details</p>
                    <ul className="mt-1 text-sm text-gray-600 space-y-1">
                      <li>Phone Number</li>
                      <li>Email Address</li>
                      <li>Preferred Contact Method</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Add Medical Information */}
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                3
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Add Medical Information</h3>
              <p className="mt-1 text-gray-600">
                Include relevant medical details and study-specific information:
              </p>
              <div className="mt-4 bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-blue-500 mr-2" />
                  <span>Primary Diagnosis/Indication</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-blue-500 mr-2" />
                  <span>Diagnosis Date (if applicable)</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 mr-2" />
                  <span>Current Medications</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Scheduling Follow-ups</h2>
        
        <div className="space-y-6">
          {/* Step 1: Access Follow-up Scheduler */}
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                1
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Access Follow-up Scheduler</h3>
              <p className="mt-1 text-gray-600">
                From the lead details page, click the "Schedule Follow-up" button or use the calendar icon in the actions menu.
              </p>
            </div>
          </div>

          {/* Step 2: Set Follow-up Details */}
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                2
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Set Follow-up Details</h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-blue-500 mt-1 mr-2" />
                  <div>
                    <p className="font-medium text-gray-900">Choose Date and Time</p>
                    <p className="text-sm text-gray-600">Select when you want to follow up with the lead</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MessageSquare className="w-5 h-5 text-blue-500 mt-1 mr-2" />
                  <div>
                    <p className="font-medium text-gray-900">Add Follow-up Notes</p>
                    <p className="text-sm text-gray-600">Include any specific topics or questions to address</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-blue-500 mt-1 mr-2" />
                  <div>
                    <p className="font-medium text-gray-900">Set Reminder Preferences</p>
                    <p className="text-sm text-gray-600">Choose how and when you want to be reminded</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Confirm and Set Reminder */}
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                3
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Confirm and Set Reminder</h3>
              <p className="mt-1 text-gray-600">
                Review the follow-up details and set your reminder preferences:
              </p>
              <div className="mt-4 bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                  <span>Email notification (24 hours before)</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                  <span>Push notification (1 hour before)</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                  <span>Calendar integration</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}