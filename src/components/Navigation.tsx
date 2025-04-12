import React, { useState, useRef, useEffect } from 'react';
import { BellRing, LogOut, User, ArrowLeft, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';

export function Navigation() {
  const navigate = useNavigate();
  const { user, impersonatedUser, stopImpersonation, logout } = useAuthStore();
  const effectiveUser = impersonatedUser || user;
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleStopImpersonation = () => {
    stopImpersonation();
    navigate('/admin/partners');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            
            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  {effectiveUser?.photoURL ? (
                    <img 
                      src={effectiveUser.photoURL} 
                      alt={effectiveUser.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-gray-200">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{effectiveUser?.name}</p>
                    <p className="text-xs text-gray-500">{effectiveUser?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowProfileDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Settings
                  </button>
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}