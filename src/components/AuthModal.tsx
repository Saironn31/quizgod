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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Glassy, glowing, bento-style background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400/20 rounded-full filter blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full filter blur-3xl animate-float" style={{animationDelay: '1s'}} />
        <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-pink-500/10 rounded-full filter blur-3xl animate-float" style={{animationDelay: '2s'}} />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-card rounded-3xl p-8 md:p-10 bg-gradient-to-br from-cyan-400/30 via-violet-500/20 to-pink-500/20 border-2 border-white/10 shadow-glow animate-fade-in">
          {/* Geometric/glowing icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 via-violet-500 to-pink-500 flex items-center justify-center text-white text-4xl font-black shadow-glow animate-bounce-soft">
              <span className="drop-shadow-lg">QG</span>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="flex rounded-xl bg-white/10 dark:bg-gray-800/30 p-1 w-full shadow-inner" role="tablist" aria-label="Authentication tabs">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isLogin}
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 py-2 px-3 text-base font-bold rounded-xl transition-all ${isLogin ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-glow' : 'text-slate-300 hover:bg-white/10'}`}
                >
                  Login
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={!isLogin}
                  onClick={() => setActiveTab('signup')}
                  className={`flex-1 py-2 px-3 text-base font-bold rounded-xl transition-all ${!isLogin ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-glow' : 'text-slate-300 hover:bg-white/10'}`}
                >
                  Sign up
                </button>
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-3 text-slate-400 hover:text-white text-2xl p-1 hover:bg-white/10 rounded-xl transition-colors"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label htmlFor="auth-name" className="block text-base font-semibold text-white mb-2">Name</label>
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 text-base rounded-xl bg-white/20 dark:bg-gray-800/40 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 border-none shadow-inner"
                  placeholder="Full name"
                  aria-invalid={!!fieldErrors.name}
                />
                {fieldErrors.name && <p className="mt-1 text-xs text-pink-300">{fieldErrors.name}</p>}
              </div>
            )}
            <div>
              <label htmlFor="auth-email" className="block text-base font-semibold text-white mb-2">Email</label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-base rounded-xl bg-white/20 dark:bg-gray-800/40 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 border-none shadow-inner"
                placeholder="you@domain.com"
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email && <p className="mt-1 text-xs text-pink-300">{fieldErrors.email}</p>}
            </div>
            <div>
              <label htmlFor="auth-password" className="block text-base font-semibold text-white mb-2">Password</label>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 text-base rounded-xl bg-white/20 dark:bg-gray-800/40 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 border-none shadow-inner"
                  placeholder="Password"
                  aria-invalid={!!fieldErrors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-sm text-cyan-300 hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {fieldErrors.password && <p className="mt-1 text-xs text-pink-300">{fieldErrors.password}</p>}
            </div>
            {error && (
              <div className="text-pink-300 text-sm bg-pink-900/20 p-3 rounded-xl border border-pink-400/30">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-pink-500 text-white py-3 px-4 text-lg font-bold rounded-xl shadow-glow transition-all duration-200 disabled:opacity-60"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create account')}
            </button>
          </form>
          <div className="mt-6 text-center text-base text-slate-200">
            {isLogin ? (
              <>
                <span>Don't have an account?</span>{' '}
                <button onClick={() => setActiveTab('signup')} className="text-cyan-300 font-bold hover:underline">Create one</button>
              </>
            ) : (
              <>
                <span>Already have an account?</span>{' '}
                <button onClick={() => setActiveTab('login')} className="text-cyan-300 font-bold hover:underline">Log in</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
