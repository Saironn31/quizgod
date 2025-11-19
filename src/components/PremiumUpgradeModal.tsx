"use client";
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Extend Window interface for FastSpring
declare global {
  interface Window {
    fastspring?: {
      builder: {
        push: (config: any) => void;
        checkout: () => void;
      };
    };
  }
}

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PremiumUpgradeModal({ isOpen, onClose }: PremiumUpgradeModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    if (!user) {
      setError('Please sign in to upgrade');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if FastSpring is loaded
      if (!window.fastspring) {
        throw new Error('Payment system is loading. Please try again in a moment.');
      }

      // Configure FastSpring checkout with user data
      window.fastspring.builder.push({
        email: user.email,
        contact: {
          email: user.email,
        },
        payload: {
          userId: user.uid,
          email: user.email,
        },
        // Callback after successful purchase
        afterMarketplaceClose: function(orderReference: any) {
          if (orderReference) {
            // Payment completed, redirect to success page
            window.location.href = `/payment/success?order=${orderReference}`;
          }
        },
      });

      // Open FastSpring checkout popup
      window.fastspring.builder.checkout();
      
      setLoading(false);
    } catch (err: any) {
      console.error('Upgrade error:', err);
      setError(err.message || 'Failed to start checkout process');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-3xl p-8 max-w-2xl w-full border border-white/10 shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Upgrade to Premium
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        {/* Pricing */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="text-center mb-4">
            <div className="text-5xl font-bold text-white mb-2">$4.99</div>
            <div className="text-slate-400">One-time payment • Lifetime access</div>
            <div className="text-xs text-slate-500 mt-2">Secure global payment • All currencies supported</div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-4 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Premium Features:</h3>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
            <div>
              <div className="text-white font-semibold">Classes & Study Groups</div>
              <div className="text-slate-400 text-sm">Create unlimited classes, invite members, and track progress</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
            <div>
              <div className="text-white font-semibold">AI Quiz Generator</div>
              <div className="text-slate-400 text-sm">Generate quizzes from any text or PDF using advanced AI</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
            <div>
              <div className="text-white font-semibold">Ad-Free Experience</div>
              <div className="text-slate-400 text-sm">Enjoy QuizGod without any advertisements</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
            <div>
              <div className="text-white font-semibold">Priority Support</div>
              <div className="text-slate-400 text-sm">Get help faster with premium support</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
            <div>
              <div className="text-white font-semibold">Future Features</div>
              <div className="text-slate-400 text-sm">Get access to all upcoming premium features</div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-purple-500/50"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processing...</span>
            </div>
          ) : (
            'Upgrade Now'
          )}
        </button>

        {/* Security Note */}
        <p className="text-center text-slate-400 text-xs mt-4">
          🔒 Secure payment powered by FastSpring • Merchant of Record
        </p>
      </div>
    </div>
  );
}
