import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardPage } from './DashboardPage';
import { AdminProfileSettings } from './AdminProfileSettings';
import { EnhancedUserManager } from './EnhancedUserManager';
import { ActivityLogManager } from './ActivityLogManager';
import { BillingDashboard } from './BillingDashboard';
import { AdvancedFormBuilder } from './AdvancedFormBuilder';
import { LeadStatusViewer } from './LeadStatusViewer';
import { NotificationsPage } from './NotificationsPage';
import { useAuthStore } from '../../store/useAuthStore';
import { Routes, Route, Navigate } from 'react-router-dom';
import { verifyUserPermissions } from '../../lib/verifyPermissions';
import { AlertCircle } from 'lucide-react';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    // Verify user permissions
    const checkAdminPermissions = async () => {
      if (!user?.id) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        const permissionCheck = await verifyUserPermissions(user.id);
        if (permissionCheck.isAdmin || permissionCheck.hasAdminRole) {
          setIsAdmin(true);
        } else {
          setError("You do not have permission to access the admin dashboard");
          // Redirect to regular dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        }
      } catch (err) {
        console.error('Error verifying permissions:', err);
        setError("Error verifying administrator permissions");
      } finally {
        setLoading(false);
      }
    };

    checkAdminPermissions();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto mt-10 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
        <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
        <div>
          <p className="font-medium">{error}</p>
          <p className="mt-2">Redirecting to main dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/users" element={<EnhancedUserManager />} />
        <Route path="/profile" element={<AdminProfileSettings />} />
        <Route path="/logs" element={<ActivityLogManager />} />
        <Route path="/billing" element={<BillingDashboard />} />
        <Route path="/forms/new" element={<AdvancedFormBuilder />} />
        <Route path="/forms/:id" element={<AdvancedFormBuilder />} />
        <Route path="/leads-status" element={<LeadStatusViewer />} />
        <Route path="/partner-leads/:id" element={<LeadStatusViewer />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Routes>
    </div>
  );
}