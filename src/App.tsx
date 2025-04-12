import React, { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { Navigation } from './components/Navigation';
import { Sidebar } from './components/Sidebar';
import { AppRouter } from './router';

function App() {
  const { user, impersonatedUser, initializeAuthState, isLoading, initialized } = useAuthStore();
  const effectiveUser = impersonatedUser || user;

  useEffect(() => {
    const unsubscribe = initializeAuthState();
    return () => unsubscribe();
  }, [initializeAuthState]);

  // Show loading state while auth initializes
  if (!initialized || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If not authenticated, the router will handle redirecting to login
  if (!user) {
    return <AppRouter />;
  }

  // Show main app layout with navigation for authenticated users
  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 pl-64 pt-16">
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AppRouter />
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;