import React, { useState } from 'react';
import { 
  Search, 
  HelpCircle, 
  MessageSquare, 
  FileText, 
  Phone, 
  ExternalLink,
  PlayCircle,
  ClipboardList,
  Users,
  Bell,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  Inbox,
  BarChart3
} from 'lucide-react';
import { AddLeadInstructions } from './AddLeadInstructions';

interface GuideSection {
  title: string;
  description: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

export function SupportPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const gettingStartedGuide: GuideSection = {
    title: "Getting Started Guide",
    description: "Learn the basics of using the platform",
    icon: PlayCircle,
    content: (
      <div className="space-y-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Welcome to the Platform!</h3>
          <p className="text-blue-700">
            Follow these steps to get started with managing your clinical trial leads effectively.
          </p>
        </div>

        <div className="space-y-8">
          {/* Step 1 */}
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                1
              </div>
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-medium text-gray-900">Set Up Your Profile</h4>
              <p className="mt-2 text-gray-600">
                Complete your research site profile with essential information:
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center text-gray-600">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                  Update contact information
                </li>
                <li className="flex items-center text-gray-600">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                  Add site specialties and certifications
                </li>
                <li className="flex items-center text-gray-600">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                  Configure notification preferences
                </li>
              </ul>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                2
              </div>
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-medium text-gray-900">Understand Your Dashboard</h4>
              <p className="mt-2 text-gray-600">
                Familiarize yourself with key metrics and features:
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <BarChart3 className="w-5 h-5 text-blue-500 mr-2" />
                    <span className="font-medium">Performance Metrics</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Track response rates, conversion metrics, and study progress
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <Inbox className="w-5 h-5 text-blue-500 mr-2" />
                    <span className="font-medium">Lead Management</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    View and manage incoming patient referrals
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                3
              </div>
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-medium text-gray-900">Set Up Communication Preferences</h4>
              <p className="mt-2 text-gray-600">
                Configure how you'll receive and respond to leads:
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center">
                  <Bell className="w-5 h-5 text-blue-500 mr-2" />
                  <span>Enable notifications for new leads</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-blue-500 mr-2" />
                  <span>Set response time goals</span>
                </div>
                <div className="flex items-center">
                  <MessageSquare className="w-5 h-5 text-blue-500 mr-2" />
                  <span>Configure messaging templates</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  };

  const leadManagementGuide: GuideSection = {
    title: "Lead Management Guide",
    description: "Learn how to effectively manage and track leads",
    icon: ClipboardList,
    content: <AddLeadInstructions />
  };

  const sections = [gettingStartedGuide, leadManagementGuide];
  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">How can we help?</h1>
        <p className="mt-4 text-lg text-gray-600">
          Search our help center or browse common topics below
        </p>
        <div className="mt-6 relative max-w-xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="space-y-6">
        {filteredSections.map((section) => (
          <div key={section.title} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === section.title ? null : section.title)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <section.icon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4 text-left">
                  <h2 className="text-lg font-medium text-gray-900">{section.title}</h2>
                  <p className="mt-1 text-sm text-gray-500">{section.description}</p>
                </div>
              </div>
              {expandedSection === section.title ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
            {expandedSection === section.title && (
              <div className="px-6 py-4 border-t border-gray-200">
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-blue-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-blue-900">Still need help?</h3>
            <p className="mt-1 text-blue-700">
              Our support team is available 24/7 to assist you
            </p>
          </div>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <MessageSquare className="w-5 h-5 mr-2" />
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}