import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, updateDoc, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { updatePassword, updateEmail, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Save,
  AlertCircle,
  CheckCircle,
  X,
  Plus,
  Trash2,
  Stethoscope,
  User,
  Lock,
  Key,
  FileText,
  Globe,
  UserCircle,
  Calendar,
  Award,
  Clock,
  Users,
  CreditCard,
  Briefcase
} from 'lucide-react';

interface SiteDetails {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  principalInvestigator: string;
  specialties: string[];
  certifications: string[];
}

interface SiteLocation {
  id?: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  isMain: boolean;
  principalInvestigator?: string;
}

interface CredentialsForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  newEmail: string;
}

function SettingsPage() {
  const { user, impersonatedUser } = useAuthStore();
  const effectiveUser = impersonatedUser || user;
  
  const [activeTab, setActiveTab] = useState<'profile' | 'credentials' | 'sites'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [userProfile, setUserProfile] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    position: '',
    website: '',
    bio: '',
    jobTitle: '',
    department: '',
  });
  
  const [siteDetails, setSiteDetails] = useState<SiteDetails>({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: effectiveUser?.email || '',
    principalInvestigator: '',
    specialties: [],
    certifications: []
  });

  const [credentials, setCredentials] = useState<CredentialsForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    newEmail: effectiveUser?.email || ''
  });

  const [newSpecialty, setNewSpecialty] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [siteLocations, setSiteLocations] = useState<SiteLocation[]>([]);
  const [newLocation, setNewLocation] = useState<SiteLocation>({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    isMain: false
  });
  const [showLocationForm, setShowLocationForm] = useState(false);

  useEffect(() => {
    if (effectiveUser?.id) {
      fetchUserDetails();
      if (effectiveUser?.role === 'partner') {
        fetchSiteLocations();
      }
    }
  }, [effectiveUser?.id, effectiveUser?.role]);

  const fetchUserDetails = async () => {
    if (!effectiveUser?.id) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'partners', effectiveUser.id));
      if (!userDoc.exists()) {
        setError('User profile not found. Please contact support.');
        return;
      }

      const data = userDoc.data();
      console.log("Fetched user data:", data); // Debugging
      
      // Set user profile data
      setUserProfile({
        firstName: data.firstName || (data.name ? data.name.split(' ')[0] : ''),
        lastName: data.lastName || (data.name ? data.name.split(' ').slice(1).join(' ') : ''),
        phone: data.phone || '',
        company: data.company || data.siteName || '', // Use siteName as fallback for company
        position: data.position || '',
        website: data.website || '',
        bio: data.bio || '',
        jobTitle: data.jobTitle || '',
        department: data.department || '',
      });
      
      if (effectiveUser.role === 'partner') {
        setSiteDetails({
          name: data.siteName || data.company || '', // Use company as fallback for siteName
          address: data.siteDetails?.address || '',
          city: data.siteDetails?.city || '',
          state: data.siteDetails?.state || '',
          zipCode: data.siteDetails?.zipCode || '',
          phone: data.siteDetails?.phone || data.phone || '', // Use personal phone as fallback
          email: data.email || effectiveUser.email || '',
          principalInvestigator: data.siteDetails?.principalInvestigator || '',
          specialties: data.siteDetails?.specialties || [],
          certifications: data.siteDetails?.certifications || []
        });
      }

      setCredentials(prev => ({
        ...prev,
        newEmail: data.email || effectiveUser.email || ''
      }));
    } catch (err) {
      console.error('Error fetching site details:', err);
      setError('Failed to load site details. Please try again.');
    }
  };

  const fetchSiteLocations = async () => {
    if (!effectiveUser?.id) return;

    try {
      const locationsRef = collection(db, `partners/${effectiveUser.id}/locations`);
      const snapshot = await getDocs(locationsRef);
      const locations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SiteLocation[];

      setSiteLocations(locations);
    } catch (err) {
      console.error('Error fetching site locations:', err);
      setError('Failed to load site locations');
    }
  };

  const handleUpdateCredentials = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error('No authenticated user found');
      }

      const credential = EmailAuthProvider.credential(
        currentUser.email,
        credentials.currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      if (credentials.newPassword) {
        if (credentials.newPassword.length < 6) {
          throw new Error('New password must be at least 6 characters long');
        }
        if (credentials.newPassword !== credentials.confirmPassword) {
          throw new Error('New passwords do not match');
        }
        await updatePassword(currentUser, credentials.newPassword);
      }

      if (credentials.newEmail && credentials.newEmail !== currentUser.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(credentials.newEmail)) {
          throw new Error('Invalid email format');
        }
        await updateEmail(currentUser, credentials.newEmail);
        
        await updateDoc(doc(db, 'partners', currentUser.uid), {
          email: credentials.newEmail,
          updatedAt: new Date()
        });
      }

      setSuccess('Credentials updated successfully');
      setCredentials({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        newEmail: credentials.newEmail
      });
    } catch (err) {
      console.error('Error updating credentials:', err);
      setError(err instanceof Error ? err.message : 'Failed to update credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    // Only site name is required for partners
    if (effectiveUser?.role === 'partner' && !siteDetails.name) {
      setError('Site name is required');
      return false;
    }
    
    // Basic name validation for all users
    if (!userProfile.firstName || !userProfile.lastName) {
      setError('First and last name are required');
      return false;
    }
    
    // Optional email validation
    if (siteDetails.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(siteDetails.email)) {
        setError('Invalid email format');
        return false;
      }
    }
    
    // Optional phone validation
    if (userProfile.phone) {
      const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
      if (!phoneRegex.test(userProfile.phone)) {
        setError('Invalid phone number format');
        return false;
      }
    }
    
    // Optional ZIP code validation
    if (siteDetails.zipCode) {
      const zipRegex = /^\d{5}(-\d{4})?$/;
      if (!zipRegex.test(siteDetails.zipCode)) {
        setError('Invalid ZIP code format');
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!effectiveUser?.id) {
      setError('User not authenticated. Please log in again.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userDoc = await getDoc(doc(db, 'partners', effectiveUser.id));
      if (!userDoc.exists()) {
        throw new Error('User profile not found. Please contact support.');
      }

      const fullName = `${userProfile.firstName} ${userProfile.lastName}`.trim();
      
      const updateData = {
        name: fullName,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        phone: userProfile.phone,
        company: userProfile.company,
        position: userProfile.position,
        website: userProfile.website,
        bio: userProfile.bio,
        jobTitle: userProfile.jobTitle,
        department: userProfile.department,
        updatedAt: new Date()
      };

      // Add site-specific fields for partners
      if (effectiveUser.role === 'partner') {
        Object.assign(updateData, {
          siteName: siteDetails.name,
          siteDetails: {
            address: siteDetails.address,
            city: siteDetails.city,
            state: siteDetails.state,
            zipCode: siteDetails.zipCode,
            phone: siteDetails.phone,
            principalInvestigator: siteDetails.principalInvestigator,
            specialties: siteDetails.specialties,
            certifications: siteDetails.certifications
          }
        });
      }

      await updateDoc(doc(db, 'partners', effectiveUser.id), updateData);

      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating site details:', err);
      setError(err instanceof Error ? err.message : 'Failed to update site details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSpecialty = () => {
    if (newSpecialty && !siteDetails.specialties.includes(newSpecialty)) {
      setSiteDetails(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty]
      }));
      setNewSpecialty('');
    }
  };

  const handleRemoveSpecialty = (specialty: string) => {
    setSiteDetails(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  const handleAddCertification = () => {
    if (newCertification && !siteDetails.certifications.includes(newCertification)) {
      setSiteDetails(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification]
      }));
      setNewCertification('');
    }
  };

  const handleRemoveCertification = (certification: string) => {
    setSiteDetails(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c !== certification)
    }));
  };

  const handleSaveLocation = async () => {
    if (!effectiveUser?.id) {
      setError('User not authenticated');
      return;
    }

    if (!newLocation.name || !newLocation.address || !newLocation.city) {
      setError('Location name, address, and city are required');
      return;
    }

    setIsLoading(true);
    try {
      const locationsRef = collection(db, `partners/${effectiveUser.id}/locations`);
      await addDoc(locationsRef, {
        ...newLocation,
        createdAt: new Date()
      });

      // Reset form and fetch updated locations
      setNewLocation({
        name: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        isMain: false
      });
      setShowLocationForm(false);
      await fetchSiteLocations();
      setSuccess('Location added successfully');
    } catch (err) {
      setError('Failed to add location');
      console.error('Error adding location:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLocation = async (id?: string) => {
    if (!id || !effectiveUser?.id) return;
    
    if (window.confirm('Are you sure you want to delete this location?')) {
      setIsLoading(true);
      try {
        await deleteDoc(doc(db, `partners/${effectiveUser.id}/locations`, id));
        setSiteLocations(prev => prev.filter(location => location.id !== id));
        setSuccess('Location deleted successfully');
      } catch (err) {
        setError('Failed to delete location');
        console.error('Error deleting location:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isAdmin = user?.role === 'admin';
  const isPartner = effectiveUser?.role === 'partner';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Profile Settings
          </button>
          {isPartner && (
            <button
              onClick={() => setActiveTab('sites')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sites'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Site Locations
            </button>
          )}
          <button
            onClick={() => setActiveTab('credentials')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'credentials'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Credentials
          </button>
        </nav>
      </div>

      {activeTab === 'credentials' ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Update Credentials</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Password</label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={credentials.currentPassword}
                  onChange={(e) => setCredentials({ ...credentials, currentPassword: e.target.value })}
                  className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter current password"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <div className="mt-1 relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={credentials.newPassword}
                  onChange={(e) => setCredentials({ ...credentials, newPassword: e.target.value })}
                  className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter new password"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <div className="mt-1 relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={credentials.confirmPassword}
                  onChange={(e) => setCredentials({ ...credentials, confirmPassword: e.target.value })}
                  className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">New Email Address</label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={credentials.newEmail}
                  onChange={(e) => setCredentials({ ...credentials, newEmail: e.target.value })}
                  className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter new email address"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                {success}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleUpdateCredentials}
                disabled={isLoading || !credentials.currentPassword}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-5 h-5 mr-2" />
                {isLoading ? 'Updating...' : 'Update Credentials'}
              </button>
            </div>
          </div>
        </div>
      ) : activeTab === 'sites' && isPartner ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">Site Locations</h2>
            <button
              onClick={() => setShowLocationForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Location
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center mb-6">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center mb-6">
              <CheckCircle className="w-5 h-5 mr-2" />
              {success}
            </div>
          )}

          {/* Location List */}
          <div className="space-y-4">
            {siteLocations.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No locations</h3>
                <p className="mt-1 text-sm text-gray-500">Add your first site location to get started.</p>
              </div>
            ) : (
              siteLocations.map(location => (
                <div key={location.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{location.name}</h3>
                      <div className="mt-2 space-y-1 text-sm text-gray-500">
                        <p>{location.address}</p>
                        <p>{location.city}, {location.state} {location.zipCode}</p>
                        <p>Phone: {location.phone}</p>
                        {location.isMain && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Main Location
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteLocation(location.id)}
                      className="text-red-600 hover:text-red-800"
                      disabled={isLoading}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Location Form */}
          {showLocationForm && (
            <div className="mt-6 p-4 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Location</h3>
                <button
                  onClick={() => setShowLocationForm(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="new-location-name" className="block text-sm font-medium text-gray-700">
                    Location Name
                  </label>
                  <input
                    type="text"
                    id="new-location-name"
                    value={newLocation.name}
                    onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Main Office, Satellite Location, etc."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="new-location-address" className="block text-sm font-medium text-gray-700">
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="new-location-address"
                    value={newLocation.address}
                    onChange={(e) => setNewLocation({...newLocation, address: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="123 Main St"
                  />
                </div>

                <div>
                  <label htmlFor="new-location-city" className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    id="new-location-city"
                    value={newLocation.city}
                    onChange={(e) => setNewLocation({...newLocation, city: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label htmlFor="new-location-state" className="block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <input
                    type="text"
                    id="new-location-state"
                    value={newLocation.state}
                    onChange={(e) => setNewLocation({...newLocation, state: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="State"
                  />
                </div>

                <div>
                  <label htmlFor="new-location-zip" className="block text-sm font-medium text-gray-700">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    id="new-location-zip"
                    value={newLocation.zipCode}
                    onChange={(e) => setNewLocation({...newLocation, zipCode: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="12345"
                  />
                </div>

                <div>
                  <label htmlFor="new-location-phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="new-location-phone"
                    value={newLocation.phone}
                    onChange={(e) => setNewLocation({...newLocation, phone: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="new-location-pi" className="block text-sm font-medium text-gray-700">
                    Principal Investigator
                  </label>
                  <input
                    type="text"
                    id="new-location-pi"
                    value={newLocation.principalInvestigator || ''}
                    onChange={(e) => setNewLocation({...newLocation, principalInvestigator: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Dr. Jane Smith"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center">
                  <input
                    type="checkbox"
                    id="new-location-main"
                    checked={newLocation.isMain}
                    onChange={(e) => setNewLocation({...newLocation, isMain: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="new-location-main" className="ml-2 block text-sm text-gray-700">
                    This is our main location
                  </label>
                </div>

                <div className="sm:col-span-2 pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveLocation}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Add Location'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {isAdmin ? 'Admin Profile Settings' : 'Research Site Profile'}
            </h1>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          <div className="space-y-6">
            {/* Personal Information Section - Available for all users */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center mb-4">
                <UserCircle className="h-8 w-8 text-gray-400 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <div className="mt-1 relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={userProfile.firstName}
                      onChange={(e) => setUserProfile({ ...userProfile, firstName: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="First Name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <div className="mt-1 relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={userProfile.lastName}
                      onChange={(e) => setUserProfile({ ...userProfile, lastName: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="Last Name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <div className="mt-1 relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={userProfile.phone}
                      onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="mt-1 relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={effectiveUser?.email}
                      disabled={true}
                      className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-500"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">To change your email, use the Credentials tab.</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Bio</label>
                  <div className="mt-1">
                    <textarea
                      value={userProfile.bio}
                      onChange={(e) => setUserProfile({ ...userProfile, bio: e.target.value })}
                      rows={4}
                      disabled={!isEditing}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="A brief description about yourself..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Information Section */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center mb-4">
                <Briefcase className="h-8 w-8 text-gray-400 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Professional Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Organization / Company</label>
                  <div className="mt-1 relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={userProfile.company}
                      onChange={(e) => setUserProfile({ ...userProfile, company: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="Company Name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Job Title</label>
                  <div className="mt-1 relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={userProfile.jobTitle}
                      onChange={(e) => setUserProfile({ ...userProfile, jobTitle: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="Your job title"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <div className="mt-1 relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={userProfile.department}
                      onChange={(e) => setUserProfile({ ...userProfile, department: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="Department"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Website</label>
                  <div className="mt-1 relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={userProfile.website}
                      onChange={(e) => setUserProfile({ ...userProfile, website: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {isPartner && (
              <>
                {/* Research Site Information Section - Only for Partners */}
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex items-center mb-4">
                    <Building2 className="h-8 w-8 text-gray-400 mr-2" />
                    <h2 className="text-lg font-medium text-gray-900">Main Research Site</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Site Name</label>
                      <div className="mt-1 relative">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          value={siteDetails.name}
                          onChange={(e) => setSiteDetails({ ...siteDetails, name: e.target.value })}
                          disabled={!isEditing}
                          className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                          placeholder="Research Site Name"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <div className="mt-1 relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          value={siteDetails.address}
                          onChange={(e) => setSiteDetails({ ...siteDetails, address: e.target.value })}
                          disabled={!isEditing}
                          className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                          placeholder="123 Research Dr."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">City</label>
                      <input
                        type="text"
                        value={siteDetails.city}
                        onChange={(e) => setSiteDetails({ ...siteDetails, city: e.target.value })}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                        placeholder="City"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">State</label>
                      <input
                        type="text"
                        value={siteDetails.state}
                        onChange={(e) => setSiteDetails({ ...siteDetails, state: e.target.value })}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                        placeholder="State"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                      <input
                        type="text"
                        value={siteDetails.zipCode}
                        onChange={(e) => setSiteDetails({ ...siteDetails, zipCode: e.target.value })}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                        placeholder="12345"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Site Phone Number</label>
                      <div className="mt-1 relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="tel"
                          value={siteDetails.phone}
                          onChange={(e) => setSiteDetails({ ...siteDetails, phone: e.target.value })}
                          disabled={!isEditing}
                          className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Principal Investigator</label>
                      <div className="mt-1 relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          value={siteDetails.principalInvestigator}
                          onChange={(e) => setSiteDetails({ ...siteDetails, principalInvestigator: e.target.value })}
                          disabled={!isEditing}
                          className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                          placeholder="Dr. John Smith"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Research Specialties Section - Only for Partners */}
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex items-center mb-4">
                    <Stethoscope className="h-8 w-8 text-gray-400 mr-2" />
                    <h2 className="text-lg font-medium text-gray-900">Research Specialties</h2>
                  </div>
                  <div className="space-y-4">
                    {isEditing && (
                      <div className="flex space-x-2">
                        <div className="relative flex-1">
                          <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            value={newSpecialty}
                            onChange={(e) => setNewSpecialty(e.target.value)}
                            className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Add specialty (e.g., Cardiology)"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddSpecialty}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {siteDetails.specialties.map((specialty) => (
                        <div
                          key={specialty}
                          className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full"
                        >
                          <span>{specialty}</span>
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSpecialty(specialty)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {siteDetails.specialties.length === 0 && (
                        <span className="text-gray-500 text-sm">No specialties added yet</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Certifications Section - Only for Partners */}
                <div>
                  <div className="flex items-center mb-4">
                    <Award className="h-8 w-8 text-gray-400 mr-2" />
                    <h2 className="text-lg font-medium text-gray-900">Certifications</h2>
                  </div>
                  <div className="space-y-4">
                    {isEditing && (
                      <div className="flex space-x-2">
                        <div className="relative flex-1">
                          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            value={newCertification}
                            onChange={(e) => setNewCertification(e.target.value)}
                            className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Add certification (e.g., GCP Certified)"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddCertification}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {siteDetails.certifications.map((certification) => (
                        <div
                          key={certification}
                          className="flex items-center bg-green-50 text-green-700 px-3 py-1 rounded-full"
                        >
                          <span>{certification}</span>
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCertification(certification)}
                              className="ml-2 text-green-600 hover:text-green-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {siteDetails.certifications.length === 0 && (
                        <span className="text-gray-500 text-sm">No certifications added yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                {success}
              </div>
            )}

            {isEditing && (
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;