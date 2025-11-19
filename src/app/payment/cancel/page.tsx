"use client";
import Link from 'next/link';

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-20 w-96 h-96 bg-red-500/20 rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-orange-500/20 rounded-full filter blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
      </div>

      <div className="relative z-10 glass-card rounded-3xl p-12 max-w-2xl text-center">
        <div className="text-6xl mb-6">❌</div>
        <h1 className="text-4xl md:text-5xl font-black mb-4 text-white">Payment Cancelled</h1>
        <p className="text-slate-300 text-lg mb-8">
          Your payment was cancelled. No charges have been made to your account.
        </p>
        
        <p className="text-slate-400 mb-8">
          You can try again anytime or continue using QuizGod with free features.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/"
            className="px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:scale-105 transition-transform"
          >
            Go to Dashboard
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="px-8 py-4 rounded-xl font-bold bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
