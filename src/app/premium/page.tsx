'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import SideNav from '@/components/SideNav';
import { initializePaddle, type Paddle } from '@paddle/paddle-js';

export default function PremiumPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [paddle, setPaddle] = useState<Paddle>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('🔧 Initializing Paddle with config:', {
      environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT,
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
    });

    initializePaddle({
      environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as 'sandbox' | 'production',
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
      eventCallback: (data) => {
        console.log('🎯 Paddle event received:', {
          name: data.name,
          type: data.type,
          data: data.data,
          detail: data.detail,
          code: data.code,
          fullData: data
        });
        
        if (data.name === 'checkout.error' || data.type === 'checkout.error') {
          console.error('❌ Paddle checkout error:', {
            error: data,
            detail: data.detail,
            code: data.code,
            message: data.data || data.detail || 'Unknown error'
          });
          alert(`Checkout Error: ${data.detail || data.code || 'Unknown error'}\n\nPlease check console for details.`);
        }
        
        if (data.name === 'checkout.completed') {
          console.log('✅ Checkout completed successfully:', data);
        }
        
        // Log all events for debugging
        if (!data.name && !data.type) {
          console.warn('⚠️ Received event with no name or type:', data);
        }
      }
    }).then((paddleInstance: Paddle | undefined) => {
      if (paddleInstance) {
        setPaddle(paddleInstance);
        console.log('✅ Paddle initialized successfully');
      } else {
        console.error('❌ Paddle initialization returned undefined');
      }
    }).catch((error) => {
      console.error('❌ Failed to initialize Paddle:', {
        error,
        message: error?.message,
        stack: error?.stack
      });
    });
  }, []);

  const handleUpgrade = () => {
    console.log('🚀 handleUpgrade called');
    
    if (!user) {
      console.error('❌ No user found');
      alert('Please log in to upgrade to premium');
      return;
    }

    console.log('👤 User info:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    });

    if (!paddle) {
      console.error('❌ Paddle instance not ready');
      alert('Payment system is loading, please try again in a moment');
      return;
    }

    console.log('✅ Paddle instance ready');
    setLoading(true);

    const priceId = selectedPlan === 'monthly' 
      ? process.env.NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID 
      : process.env.NEXT_PUBLIC_PADDLE_YEARLY_PRICE_ID;

    const checkoutConfig = {
      items: [{ priceId: priceId!, quantity: 1 }],
      customData: {
        userId: user.uid,
        userEmail: user.email || ''
      },
      ...(user.email && {
        customer: {
          email: user.email
        }
      }),
      settings: {
        displayMode: 'overlay',
        theme: 'dark',
        locale: 'en'
      }
    };

    console.log('🛒 Opening checkout with config:', {
      priceId,
      selectedPlan,
      fullConfig: checkoutConfig
    });

    try {
      paddle.Checkout.open(checkoutConfig);
      console.log('✅ Checkout.open() called successfully');
    } catch (error) {
      console.error('❌ Checkout error:', {
        error,
        message: error?.message,
        stack: error?.stack,
        type: typeof error
      });
      alert('Failed to open checkout. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const plans = {
    monthly: {
      price: 5.00,
      period: 'month',
      savings: null
    },
    yearly: {
      price: 50.00,
      period: 'year',
      savings: '17% OFF'
    }
  };

  const features = [
    { icon: '🚀', text: 'Unlimited AI Quiz Generation', premium: true },
    { icon: '📚', text: 'Unlimited Quiz Creation', premium: true },
    { icon: '🎯', text: 'Advanced Question Types', premium: true },
    { icon: '⏱️', text: 'Custom Timer Settings', premium: true },
    { icon: '🏆', text: 'Detailed Analytics & Reports', premium: true },
    { icon: '👥', text: 'Live Multiplayer Quizzes', premium: true },
    { icon: '📊', text: 'Student Progress Tracking', premium: true },
    { icon: '🎨', text: 'Custom Quiz Themes', premium: true },
    { icon: '📤', text: 'Export Quiz Results', premium: true },
    { icon: '🔒', text: 'Priority Support', premium: true },
    { icon: '☁️', text: 'Unlimited Cloud Storage', premium: true },
    { icon: '✨', text: 'Early Access to New Features', premium: true }
  ];

  const freeFeatures = [
    { icon: '📝', text: 'Basic Quiz Creation (5/month)' },
    { icon: '🤖', text: 'AI Generation (3/month)' },
    { icon: '📖', text: 'Access to Public Quizzes' },
    { icon: '💾', text: 'Basic Storage (100MB)' }
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <SideNav />
      <div className="md:ml-64 min-h-screen">
        <div className="p-4 md:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <span className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-bold">
              ⭐ PREMIUM
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Upgrade to <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Premium</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Unlock unlimited quiz creation, advanced AI features, and powerful analytics to supercharge your learning experience
          </p>
        </div>

        {/* Pricing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-full p-1 flex gap-1">
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                selectedPlan === 'monthly'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedPlan('yearly')}
              className={`px-6 py-3 rounded-full font-semibold transition-all relative ${
                selectedPlan === 'yearly'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-xs px-2 py-1 rounded-full text-white font-bold">
                SAVE 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Free Plan */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border-2 border-white/10">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-white">$0</span>
                <span className="text-slate-400">/forever</span>
              </div>
            </div>
            
            <ul className="space-y-4 mb-8">
              {freeFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-2xl">{feature.icon}</span>
                  <span className="text-slate-300">{feature.text}</span>
                </li>
              ))}
            </ul>

            <button
              disabled
              className="w-full py-4 bg-white/10 text-slate-400 rounded-xl font-bold cursor-not-allowed"
            >
              Current Plan
            </button>
          </div>

          {/* Premium Plan */}
          <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-2xl p-8 border-2 border-purple-400/50 relative overflow-hidden">
            {/* Popular Badge */}
            <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 text-sm font-bold">
              🔥 MOST POPULAR
            </div>

            <div className="mb-6 mt-8">
              <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-white">
                  ${plans[selectedPlan].price}
                </span>
                <span className="text-slate-300">/{plans[selectedPlan].period}</span>
              </div>
              {plans[selectedPlan].savings && (
                <span className="inline-block mt-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
                  {plans[selectedPlan].savings}
                </span>
              )}
            </div>

            <ul className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-2xl">{feature.icon}</span>
                  <span className="text-white font-medium">{feature.text}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={loading || !paddle}
              className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? '⏳ Loading...' : !paddle ? '⏳ Initializing...' : '🚀 Upgrade to Premium'}
            </button>
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border-2 border-white/10">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Why Go Premium?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                ⚡
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Lightning Fast</h3>
              <p className="text-slate-300">
                Generate unlimited quizzes with AI in seconds. No more waiting or limits.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                📈
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Track Progress</h3>
              <p className="text-slate-300">
                Detailed analytics and reports help you understand student performance better.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                🎯
              </div>
              <h3 className="text-xl font-bold text-white mb-2">More Features</h3>
              <p className="text-slate-300">
                Access all question types, live multiplayer, custom themes, and more.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-slate-300">
                Yes! You can cancel your subscription at any time. No questions asked.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-slate-300">
                We accept all major credit cards, PayPal, and other secure payment methods.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-2">
                How do I upgrade?
              </h3>
              <p className="text-slate-300">
                Contact us at quizgod25@gmail.com to upgrade your account to premium.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-slate-300">
                Yes! We offer a 30-day money-back guarantee. No risk, just results.
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-12">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all"
          >
            ← Back
          </button>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}
