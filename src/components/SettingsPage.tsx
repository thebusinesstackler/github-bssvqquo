import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useDropzone } from 'react-dropzone';
import { User, PenSquare, X, CheckCircle, AlertTriangle, Upload, Camera, Calendar, CreditCard, Building2 } from 'lucide-react';
import { uploadProfilePicture, updateUserProfile } from '../lib/firebase';
import { format } from 'date-fns';

export function SettingsPage() {
  const { user, updateProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    email: user?.email || '',
    photoURL: user?.photoURL || ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        email: user.email || '',
        photoURL: user.photoURL || ''
      });
    }
  }, [user]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !user) return;

    setIsUploading(true);
    setError(null);

    try {
      const downloadURL = await uploadProfilePicture(file, user.id);
      setProfileData(prev => ({ ...prev, photoURL: downloadURL }));
      await updateUserProfile(user.id, { photoURL: downloadURL });
      setSuccess('Profile picture updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload profile picture');
    } finally {
      setIsUploading(false);
    }
  }, [user]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1
  });

  const handleProfileUpdate = async () => {
    if (!user) return;

    setError(null);
    setSuccess(null);

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (profileData.email && !emailRegex.test(profileData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Validate first name
      if (profileData.firstName.trim().length < 2) {
        throw new Error('First name must be at least 2 characters long');
      }

      await updateProfile({
        firstName: profileData.firstName,
        email: profileData.email
      });

      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
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

          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div
                className={`w-32 h-32 rounded-full overflow-hidden bg-gray-100 ${
                  isEditing ? 'cursor-pointer' : ''
                }`}
                {...(isEditing ? getRootProps() : {})}
              >
                {profileData.photoURL ? (
                  <img
                    src={profileData.photoURL}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                {isEditing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>
              {isEditing && (
                <input {...getInputProps()} />
              )}
            </div>
            {isEditing && (
              <p className="mt-2 text-sm text-gray-500">
                Click to upload a new profile picture (JPG/PNG, max 5MB)
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                value={profileData.firstName}
                onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                disabled={!isEditing}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                disabled={!isEditing}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Subscription Information */}
          {user?.subscription && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start">
                  <Building2 className="w-5 h-5 text-gray-400 mt-1 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Current Plan</p>
                    <p className="text-sm text-gray-500 capitalize">{user.subscription}</p>
                  </div>
                </div>

                {user.billing?.nextBillingDate && (
                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 text-gray-400 mt-1 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Next Billing Date</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(user.billing.nextBillingDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                )}

                {user.billing?.amount && (
                  <div className="flex items-start">
                    <CreditCard className="w-5 h-5 text-gray-400 mt-1 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Monthly Amount</p>
                      <p className="text-sm text-gray-500">
                        ${user.billing.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {isEditing && (
            <div className="flex justify-end space-x-3 mt-6">
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

          {/* Status Messages */}
          {(success || error) && (
            <div className={`mt-4 p-4 rounded-lg ${
              success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {success ? (
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {success}
                </div>
              ) : (
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}