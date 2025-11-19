"use client";
import Link from 'next/link';

export default function PaymentCancelled() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-8 md:p-12 max-w-2xl w-full text-center animate-slide-up">
        {/* Cancel Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-4">
          Payment Cancelled
        </h1>

        {/* Description */}
        <p className="text-slate-300 text-lg mb-8">
          Your payment was cancelled. No charges were made to your account.
        </p>

        {/* Info Card */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <p className="text-slate-300 mb-4">
            If you encountered any issues during checkout, please contact our support team.
          </p>
          <p className="text-slate-400 text-sm">
            You can try upgrading again anytime from your account settings or when accessing premium features.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all"
          >
            Go to Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 rounded-xl font-semibold bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            Go Back
          </button>
        </div>

        {/* Help Link */}
        <p className="text-slate-400 text-sm mt-8">
          Need help? <Link href="/support" className="text-purple-400 hover:text-purple-300 underline">Contact Support</Link>
        </p>
      </div>
    </div>
  );
}
