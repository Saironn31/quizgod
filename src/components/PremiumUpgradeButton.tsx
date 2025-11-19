"use client";
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PremiumUpgradeButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function PremiumUpgradeButton({ className, children }: PremiumUpgradeButtonProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      alert('Please sign in to upgrade to premium');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
        }),
      });

      const data = await response.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.message || 'Payment system is currently being set up. Please contact admin for premium access.');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to initiate payment. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className={className || "px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"}
    >
      {loading ? 'Processing...' : (children || 'Upgrade to Premium')}
    </button>
  );
}
