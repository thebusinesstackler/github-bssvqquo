import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LeadDashboard } from './components/LeadDashboard';
import { MessagesPage } from './components/MessagesPage';
import { MyLeadsPage } from './components/MyLeadsPage';
import { LeadDetailsPage } from './components/LeadDetailsPage';
import { SupportPage } from './components/SupportPage';
import { ScreenerFormsPage } from './components/ScreenerFormsPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PartnerManagement } from './components/admin/PartnerManagement';
import { LeadManagement } from './components/admin/LeadManagement';
import { UserManagement } from './components/admin/UserManagement';
import { FormManagement } from './components/admin/FormManagement';
import { NotificationsPage as AdminNotificationsPage } from './components/admin/NotificationsPage';
import { CustomerManagement } from './components/CustomerManagement';
import { LoginPage } from './components/LoginPage';
import SettingsPage from './components/SettingsPage';
import { PartnerLeadDashboard } from './components/admin/PartnerLeadDashboard';
import { AddNewLeadPage } from './components/AddNewLeadPage';
import { useAuthStore } from './store/useAuthStore';
import { PricingPage } from './components/PricingPage';
import { DashboardPage } from './components/admin/DashboardPage';
import { AdminProfileSettings } from './components/admin/AdminProfileSettings';
import { ActivityLogManager } from './components/admin/ActivityLogManager';
import { BillingDashboard } from './components/admin/BillingDashboard';
import { EnhancedUserManager } from './components/admin/EnhancedUserManager';
import { AdvancedFormBuilder } from './components/admin/AdvancedFormBuilder';
import { LeadStatusViewer } from './components/admin/LeadStatusViewer';
import { SubscriptionManager } from './components/admin/SubscriptionManager';
import { PartnerSubscriptionDetail } from './components/admin/PartnerSubscriptionDetail';

export function AppRouter() {
  const { user, impersonatedUser } = useAuthStore();
  const effectiveUser = impersonatedUser || user;

  // Check if the user is authenticated
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Determine if we should show admin routes or partner routes
  const isAdmin = !impersonatedUser && user.role === 'admin';

  return (
    <Routes>
      {isAdmin ? (
        // Admin Routes
        <>
          <Route path="/dashboard/*" element={<AdminDashboard />}>
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<EnhancedUserManager />} />
            <Route path="profile" element={<AdminProfileSettings />} />
            <Route path="logs" element={<ActivityLogManager />} />
            <Route path="billing" element={<BillingDashboard />} />
            <Route path="forms/new" element={<AdvancedFormBuilder />} />
            <Route path="forms/:id" element={<AdvancedFormBuilder />} />
            <Route path="leads-status" element={<LeadStatusViewer />} />
            <Route path="partner-leads/:id" element={<LeadStatusViewer />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
            <Route path="subscriptions" element={<SubscriptionManager />} />
          </Route>
          <Route path="/admin/partners" element={<PartnerManagement />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/leads" element={<LeadManagement />} />
          <Route path="/admin/partner-leads" element={<PartnerLeadDashboard />} />
          <Route path="/admin/leads-status" element={<LeadStatusViewer />} />
          <Route path="/admin/forms" element={<FormManagement />} />
          <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
          <Route path="/admin/subscriptions" element={<SubscriptionManager />} />
          <Route path="/admin/subscriptions/:id" element={<PartnerSubscriptionDetail />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </>
      ) : (
        // Partner Routes (used for both actual partners and impersonated partners)
        <>
          <Route path="/dashboard" element={<LeadDashboard />} />
          <Route path="/leads" element={<MyLeadsPage />} />
          <Route path="/leads/new" element={<AddNewLeadPage />} />
          <Route path="/leads/:id" element={<LeadDetailsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/forms" element={<ScreenerFormsPage />} />
          <Route path="/customers" element={<CustomerManagement />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </>
      )}
    </Routes>
  );
}