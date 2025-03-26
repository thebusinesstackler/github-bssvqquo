import React from 'react';
import { BellRing, LogOut, User, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';

export function Navigation() {
  const navigate = useNavigate();
  const { user, impersonatedUser, stopImpersonation, logout } = useAuthStore();
  const effectiveUser = impersonatedUser || user;

  const handleStopImpersonation = () => {
    stopImpersonation();
    navigate('/admin/partners');
  };

  return (
    <nav className="bg-white shadow-sm fixed w-full z-10">
      <div className="max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <BellRing className="w-8 h-8 text-blue-600" />
            <span className="ml-2 text-xl font-semibold text-gray-900">
              Accelerate Trials
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            {impersonatedUser && (
              <div className="flex items-center">
                <span className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full mr-2">
                  Viewing as {impersonatedUser.name}
                </span>
                <button
                  onClick={handleStopImpersonation}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-5 h-5 mr-1" />
                  Exit
                </button>
              </div>
            )}
            <NotificationBell />
            <div className="flex items-center text-gray-700">
              <User className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">{effectiveUser?.name}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center text-gray-700 hover:text-gray-900"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}