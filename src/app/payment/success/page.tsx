"use client";
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // Optionally verify payment with backend
      console.log('Payment successful:', sessionId);
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-20 w-96 h-96 bg-emerald-500/20 rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-cyan-500/20 rounded-full filter blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
      </div>

      <div className="relative z-10 glass-card rounded-3xl p-12 max-w-2xl text-center">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-4xl md:text-5xl font-black mb-4 text-white">Payment Successful!</h1>
        <p className="text-slate-300 text-lg mb-8">
          Welcome to QuizGod Premium! Your account has been upgraded with full access to all premium features.
        </p>
        
        <div className="bg-white/5 rounded-2xl p-6 mb-8 text-left">
          <h3 className="text-xl font-bold text-white mb-4">You now have access to:</h3>
          <ul className="space-y-3 text-slate-300">
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 text-xl">✓</span>
              <span>Create and manage unlimited classes</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 text-xl">✓</span>
              <span>AI Quiz Generator from documents</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 text-xl">✓</span>
              <span>Ad-free experience</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 text-xl">✓</span>
              <span>Priority support</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/"
            className="px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:scale-105 transition-transform"
          >
            Go to Dashboard
          </Link>
          <Link 
            href="/classes"
            className="px-8 py-4 rounded-xl font-bold bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            Explore Classes
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
