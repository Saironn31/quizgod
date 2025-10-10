'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createUserProfile, migrateLocalDataToFirestore } from '@/lib/firestore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const isLogin = activeTab === 'login';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  const [showPassword, setShowPassword] = useState(false);

  const { login, signup } = useAuth();

  const validate = () => {
    const errs: typeof fieldErrors = {};
    if (!email || !email.includes('@')) errs.email = 'Please enter a valid email';
    if (!password || password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (!isLogin && !name) errs.name = 'Please enter your name';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        const userCredential = await signup(email, password);
        if (userCredential?.user) {
          await createUserProfile(userCredential.user.uid, email, name);
          await migrateLocalDataToFirestore(userCredential.user.uid, email);
        }
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border dark:border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <div className="flex rounded-md bg-gray-100 dark:bg-gray-700 p-1 w-full" role="tablist" aria-label="Authentication tabs">
              <button
                type="button"
                role="tab"
                aria-selected={isLogin}
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition ${isLogin ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-600 dark:text-gray-300 opacity-90'}`}
              >
                Login
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!isLogin}
                onClick={() => setActiveTab('signup')}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition ${!isLogin ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-600 dark:text-gray-300 opacity-90'}`}
              >
                Sign up
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="ml-3 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 text-xl p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="auth-name" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Name
              </label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-500 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Full name"
                aria-invalid={!!fieldErrors.name}
              />
              {fieldErrors.name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.name}</p>}
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-500 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@domain.com"
              aria-invalid={!!fieldErrors.email}
            />
            {fieldErrors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 text-base border border-gray-300 dark:border-gray-500 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Password"
                aria-invalid={!!fieldErrors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-sm text-gray-600 dark:text-gray-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {fieldErrors.password && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.password}</p>}
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 text-base font-medium rounded-md disabled:opacity-50 transition-colors shadow-md"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create account')}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
          {isLogin ? (
            <>
              <span>Don't have an account?</span>{' '}
              <button onClick={() => setActiveTab('signup')} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                Create one
              </button>
            </>
          ) : (
            <>
              <span>Already have an account?</span>{' '}
              <button onClick={() => setActiveTab('login')} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                Log in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
