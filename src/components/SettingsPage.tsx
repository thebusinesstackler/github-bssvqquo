import React, { useState } from 'react';
import { 
  User, 
  CreditCard, 
  Receipt, 
  Building2, 
  Users, 
  Save, 
  PenSquare, 
  Trash2, 
  Download,
  Bell,
  Shield,
  Globe,
  Mail,
  Smartphone,
  Clock,
  FileText,
  Settings,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Phone,
  UserPlus,
  X,
  Plus
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

type SettingsTab = 'profile' | 'payment' | 'receipts' | 'sites' | 'users' | 'notifications' | 'security';

export function SettingsPage() {
  const { user, updateProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    title: user?.title || '',
    organization: user?.organization || ''
  });

  const handleProfileUpdate = async () => {
    try {
      await updateProfile({
        name: profileData.name,
        phone: profileData.phone,
        title: profileData.title,
        organization: profileData.organization
      });
      
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`py-4 px-6 inline-flex items-center border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {isEditing ? (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <PenSquare className="w-4 h-4 mr-2" />
                      Edit
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    disabled={!isEditing}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled={true}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    disabled={!isEditing}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="(555) 555-5555"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={profileData.title}
                    onChange={(e) => setProfileData({ ...profileData, title: e.target.value })}
                    disabled={!isEditing}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="e.g. Clinical Research Director"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Organization</label>
                  <input
                    type="text"
                    value={profileData.organization}
                    onChange={(e) => setProfileData({ ...profileData, organization: e.target.value })}
                    disabled={!isEditing}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProfileUpdate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Status Messages */}
          {(success || error) && (
            <div className={`fixed bottom-4 right-4 ${
              success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            } p-4 rounded-lg shadow-lg flex items-center`}>
              {success ? (
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : (
                <AlertTriangle className="w-5 h-5 mr-2" />
              )}
              <span>{success || error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}