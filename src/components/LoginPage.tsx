import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { BellRing, AlertCircle, CheckCircle, ArrowRight, Lock, Mail, User, Building2, Eye, EyeOff } from 'lucide-react';
import { createPartnerUser } from '../lib/firebase';

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
        await createPartnerUser(email, password, name, siteName);
        setSuccess('Account created successfully! You can now sign in.');
        setIsSignUp(false);
        setEmail('');
        setPassword('');
        setName('');
        setSiteName('');
      } else {
        await login(email, password);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg">
              <BellRing className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isSignUp ? 'Create Research Site Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-600">
            {isSignUp 
              ? 'Join our network of leading research sites'
              : 'Sign in to manage your clinical trials'}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-xl p-8">
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
                      className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="pl-10 pr-10 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
              <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="text-sm">{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
          </form>
        </div>

        {/* Switch between Sign In and Sign Up */}
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
            {isSignUp 
              ? 'Already have an account? Sign in' 
              : 'Need an account? Create one'}
          </button>
        </div>
      </div>
    </div>
  );
}