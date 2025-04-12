import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { BellRing, AlertCircle, CheckCircle, ArrowRight, Lock, Mail, User, Building2, Eye, EyeOff } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

export function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [siteName, setSiteName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Validate inputs
        if (!email || !password || !name || !siteName) {
          throw new Error('Please fill in all required fields');
        }

        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }

        // Login-only mode, no sign up functionality
        setIsSignUp(false);
        setError("Sign-up is currently disabled. Please log in with existing credentials.");
        setIsLoading(false);
        return;
      } else {
        await login(email, password);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async (e: React.MouseEvent) => {
    // Ensure we're handling a direct user interaction
    e.preventDefault();
    e.stopPropagation();
    
    // Focus the window to help with popup handling
    window.focus();
    
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await signInWithGoogle('partner');
      // The auth state listener will handle the redirect
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
        setError(
          'Popup was blocked by your browser. Please enable popups for this site or try again.'
        );
      } else if (err.code === 'auth/cancelled-popup-request') {
        // User closed the popup, just clear loading state
        setIsLoading(false);
        return;
      } else {
        setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 p-6">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300">
              <BellRing className="w-14 h-14 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
            {isSignUp ? 'Create Research Site Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-600 max-w-sm mx-auto">
            {isSignUp 
              ? 'Join our network of leading research sites'
              : 'Sign in to manage your clinical trials and patient recruitment'}
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-4 border border-gray-100">
          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="group w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 mb-6 relative overflow-hidden shadow-sm"
          >
            <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600"></span>
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 mr-3" />
            {isLoading ? 'Signing in...' : 'Continue with Google'}
            <span className="absolute inset-y-0 right-4 flex items-center">
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-all" />
            </span>
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                      placeholder="John Smith"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-1">
                    Research Site Name
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="siteName"
                      type="text"
                      required
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                      placeholder="Clinical Research Center"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {isSignUp && (
                <p className="mt-1 text-xs text-gray-500">
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center border border-red-200 shadow-sm">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center border border-green-200 shadow-sm">
                <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="text-sm">{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition duration-200 hover:translate-y-[-1px]"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2" />
                  Please wait...
                </div>
              ) : (
                <div className="flex items-center">
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </div>
              )}
            </button>

            {!isSignUp && (
              <div className="text-sm text-center mt-2">
                <a href="#" className="text-blue-600 hover:text-blue-800">
                  Forgot your password?
                </a>
              </div>
            )}
          </form>
        </div>

        {/* Switch between Sign In and Sign Up - Note: Sign-up functionality is disabled */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setSuccess('');
              setEmail('');
              setPassword('');
              setName('');
              setSiteName('');
            }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {isSignUp ? (
              'Already have an account? Sign in'
            ) : (
              'Need a Research Site account? Contact us'
            )}
          </button>
        </div>
        
        <div className="text-center text-xs text-gray-500 mt-8">
          &copy; {new Date().getFullYear()} Accelerate Trials. All rights reserved.
        </div>
      </div>
    </div>
  );
}