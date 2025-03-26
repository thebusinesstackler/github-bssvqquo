import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LeadDashboard } from './components/LeadDashboard';
import { SettingsPage } from './components/SettingsPage';
import { MessagesPage } from './components/MessagesPage';
import { MyLeadsPage } from './components/MyLeadsPage';
import { LeadDetailsPage } from './components/LeadDetailsPage';
import { SupportPage } from './components/SupportPage';
import { ScreenerFormsPage } from './components/ScreenerFormsPage';
import PricingPage from './components/PricingPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PartnerManagement } from './components/admin/PartnerManagement';
import { LeadManagement } from './components/admin/LeadManagement';
import { UserManagement } from './components/admin/UserManagement';
import { FormManagement } from './components/admin/FormManagement';
import { CustomerManagement } from './components/CustomerManagement';
import { LoginPage } from './components/LoginPage';
import { Navigation } from './components/Navigation';
import { Sidebar } from './components/Sidebar';
import { useAuthStore } from './store/useAuthStore';
import { LeadDashboard as PartnerDashboard } from './components/LeadDashboard';

function App() {
  const { user, impersonatedUser, initializeAuthState } = useAuthStore();
  const effectiveUser = impersonatedUser || user;

  useEffect(() => {
    const unsubscribe = initializeAuthState();
    return () => unsubscribe();
  }, []);

  // If there's no user, show the login page
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoginPage />
      </div>
    );
  }

  // If user is authenticated, show the main app layout with navigation
  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 pl-64 pt-16">
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              {!impersonatedUser && effectiveUser?.role === 'admin' ? (
                <>
                  <Route path="/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/partners" element={<PartnerManagement />} />
                  <Route path="/admin/users" element={<UserManagement />} />
                  <Route path="/admin/leads" element={<LeadManagement />} />
                  <Route path="/admin/forms" element={<FormManagement />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </>
              ) : (
                <>
                  <Route path="/dashboard" element={<PartnerDashboard />} />
                  <Route path="/leads" element={<MyLeadsPage />} />
                  <Route path="/leads/:id" element={<LeadDetailsPage />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/forms" element={<ScreenerFormsPage />} />
                  <Route path="/customers" element={<CustomerManagement />} />
                  <Route path="/support" element={<SupportPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </>
              )}
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;