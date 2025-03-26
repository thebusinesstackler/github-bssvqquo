import React, { useState, useEffect } from 'react';
import { 
  Users,
  Search,
  UserPlus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Shield,
  UserCheck,
  UserX,
  Settings,
  Mail,
  Calendar,
  Clock,
  X,
  Lock,
  Building2
} from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import { format } from 'date-fns';
import { createPartnerUser } from '../../lib/firebase';

interface UserManagementProps {}

export function UserManagement({}: UserManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    siteName: '',
    role: 'partner' as const,
    isAdmin: false
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'all' | 'admin' | 'partner'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showRoleConfirmation, setShowRoleConfirmation] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState('');

  const { users, fetchUsers, deleteUser, updateUserRole } = useAdminStore();

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (!formData.email || !formData.password || !formData.name || !formData.siteName) {
        throw new Error('Please fill in all required fields.');
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      await createPartnerUser(formData.email, formData.password, formData.name, formData.siteName);
      
      setSuccess('User created successfully');
      setShowAddForm(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        siteName: '',
        role: 'partner',
        isAdmin: false
      });
      
      await fetchUsers();
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteUser(userId);
      setSuccess('User deleted successfully');
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleRoleChange = async (userId: string, user: any) => {
    setShowRoleConfirmation(userId);
    setConfirmationEmail('');
  };

  const confirmRoleChange = async (userId: string, isAdmin: boolean) => {
    try {
      // Verify admin email before proceeding
      if (confirmationEmail !== 'theranovex@gmail.com' && confirmationEmail !== 'digitaltackler@gmail.com') {
        throw new Error('Please enter your admin email to confirm this action');
      }

      await updateUserRole(userId, isAdmin);
      setSuccess('User role updated successfully');
      setShowRoleConfirmation(null);
      setConfirmationEmail('');
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user role');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'active' ? user.active : !user.active);
    return matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage user accounts and access levels
          </p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true);
            setError(null);
            setSuccess(null);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Add User
        </button>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          user.role === 'admin' ? 'bg-purple-100' : 'bg-blue-100'
                        }`}>
                          {user.role === 'admin' ? (
                            <Shield className="h-5 w-5 text-purple-600" />
                          ) : (
                            <Users className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <button
                        onClick={() => handleRoleChange(user.id, user)}
                        className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {user.role === 'admin' ? (
                          <>
                            <Shield className="w-4 h-4 mr-1" />
                            Admin
                          </>
                        ) : (
                          <>
                            <Users className="w-4 h-4 mr-1" />
                            Partner
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(), 'MMM d, yyyy h:mm a')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(user.createdAt, 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete user"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Add New User</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <div className="mt-1 relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John Smith"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="john.smith@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters long</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Site Name</label>
                <div className="mt-1 relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={formData.siteName}
                    onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Research Site Name"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 text-green-700 p-3 rounded-md flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {success}
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Change Confirmation Modal */}
      {showRoleConfirmation && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm Role Change
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              This is a sensitive action. Please enter your admin email to confirm.
            </p>
            <input
              type="email"
              value={confirmationEmail}
              onChange={(e) => setConfirmationEmail(e.target.value)}
              placeholder="Enter admin email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRoleConfirmation(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const user = users.find(u => u.id === showRoleConfirmation);
                  if (user) {
                    confirmRoleChange(user.id, user.role !== 'admin');
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Confirm Change
              </button>
            </div>
          </div>
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
            <AlertCircle className="w-5 h-5 mr-2" />
          )}
          <span>{success || error}</span>
        </div>
      )}
    </div>
  );
}