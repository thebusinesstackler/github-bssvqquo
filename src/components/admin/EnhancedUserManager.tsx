import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { PartnerAddModal } from './PartnerAddModal';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Loader2,
  Shield,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  LogIn
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

export function EnhancedUserManager() {
  const navigate = useNavigate();
  const { startImpersonation } = useAuthStore();
  const { partners, users, fetchUsers, fetchPartners, deleteUser, updateUserRole } = useAdminStore();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'partner'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortField, setSortField] = useState<'name' | 'created' | 'activity'>('created');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [confirmRoleUser, setConfirmRoleUser] = useState<string | null>(null);
  const [confirmRoleAction, setConfirmRoleAction] = useState<'promote' | 'demote' | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchUsers(), fetchPartners()]);
      } catch (err) {
        console.error('Error loading users:', err);
        setError('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [fetchUsers, fetchPartners]);

  const handleAddUserSuccess = () => {
    setSuccess('User added successfully');
    fetchUsers();
    fetchPartners();
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleDeleteUser = async (userId: string) => {
    setIsLoading(true);
    try {
      await deleteUser(userId);
      setSuccess('User deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
      setShowDeleteConfirm(null);
    } catch (err) {
      setError('Failed to delete user');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (userId: string, makeAdmin: boolean) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (makeAdmin) {
      setConfirmRoleAction('promote');
      setConfirmText(`Are you sure you want to promote ${user.name} to administrator role? This will give them full access to all system functions.`);
    } else {
      setConfirmRoleAction('demote');
      setConfirmText(`Are you sure you want to remove administrator privileges from ${user.name}? This will restrict their access to partner-level functions only.`);
    }
    
    setConfirmRoleUser(userId);
  };

  const confirmRoleChange = async () => {
    if (!confirmRoleUser || !confirmRoleAction) return;
    
    setIsLoading(true);
    try {
      await updateUserRole(confirmRoleUser, confirmRoleAction === 'promote');
      setSuccess(`User role updated successfully`);
      setTimeout(() => setSuccess(null), 3000);
      setConfirmRoleUser(null);
      setConfirmRoleAction(null);
    } catch (err) {
      setError('Failed to update user role');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImpersonation = async (userId: string) => {
    const user = partners.find(p => p.id === userId);
    if (!user) return;

    try {
      startImpersonation({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        active: user.active,
        subscription: user.subscription
      } as any);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error during impersonation:', err);
      setError('Failed to impersonate user');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSort = (field: 'name' | 'created' | 'activity') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredUsers = users.filter(user => {
    const searchMatch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const roleMatch = roleFilter === 'all' || user.role === roleFilter;
    
    const statusMatch = statusFilter === 'all' || 
                       (statusFilter === 'active' && user.active) || 
                       (statusFilter === 'inactive' && !user.active);
    
    return searchMatch && roleMatch && statusMatch;
  }).sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    
    switch (sortField) {
      case 'name':
        return direction * a.name.localeCompare(b.name);
      case 'created':
        return direction * (a.createdAt.getTime() - b.createdAt.getTime());
      case 'activity':
        // Fallback to created date if last activity isn't available
        const aActivity = a.lastActive?.getTime() || a.createdAt.getTime();
        const bActivity = b.lastActive?.getTime() || b.createdAt.getTime();
        return direction * (aActivity - bActivity);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage partners and administrators</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Add Partner
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
          >
            <Filter className="w-5 h-5 mr-2" />
            Filters
            {showFilters ? <ChevronUp className="ml-2 w-4 h-4" /> : <ChevronDown className="ml-2 w-4 h-4" />}
          </button>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="admin">Administrators</option>
                <option value="partner">Partners</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={`${sortField}-${sortDirection}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-');
                  setSortField(field as any);
                  setSortDirection(direction as any);
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="created-desc">Newest First</option>
                <option value="created-asc">Oldest First</option>
                <option value="activity-desc">Recently Active</option>
                <option value="activity-asc">Least Recently Active</option>
              </select>
            </div>
          </div>
        )}
      </div>
      
      {/* Error and Success Messages */}
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
      
      {/* Users List */}
      {isLoading && users.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center font-medium"
                    >
                      User
                      {sortField === 'name' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="w-4 h-4 ml-1" /> : 
                          <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role & Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('created')}
                      className="flex items-center font-medium"
                    >
                      Created
                      {sortField === 'created' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="w-4 h-4 ml-1" /> : 
                          <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
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
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role === 'admin' ? 'Administrator' : 'Partner'}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(user.createdAt, 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-1.5" />
                          {user.lastActive 
                            ? format(user.lastActive, 'MMM d, h:mm a')
                            : 'Never'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.subscription === 'enterprise'
                            ? 'bg-purple-100 text-purple-800'
                            : user.subscription === 'professional'
                            ? 'bg-blue-100 text-blue-800'
                            : user.subscription === 'basic'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.subscription === 'enterprise' ? 'Enterprise' :
                           user.subscription === 'professional' ? 'Professional' :
                           user.subscription === 'basic' ? 'Basic' : 'No Plan'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handleRoleChange(user.id, true)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Make Administrator"
                            >
                              <Shield className="h-5 w-5" />
                            </button>
                          )}
                          
                          {user.role === 'admin' && (
                            <button
                              onClick={() => handleRoleChange(user.id, false)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Remove Admin Role"
                            >
                              <Shield className="h-5 w-5" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleImpersonation(user.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Login As This User"
                          >
                            <LogIn className="h-5 w-5" />
                          </button>
                          
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(user.id);
                              setConfirmText(`Are you sure you want to delete ${user.name}? This action cannot be undone.`);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Delete User"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No users match your search criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Confirmation Modals */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 mb-6">{confirmText}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => showDeleteConfirm && handleDeleteUser(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4 mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete User'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {confirmRoleUser && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Role Change</h3>
            <p className="text-sm text-gray-600 mb-6">{confirmText}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setConfirmRoleUser(null);
                  setConfirmRoleAction(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmRoleChange}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4 mr-2" />
                    Updating...
                  </>
                ) : (
                  'Confirm Change'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add User Modal */}
      {showAddModal && (
        <PartnerAddModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={handleAddUserSuccess}
        />
      )}
    </div>
  );
}