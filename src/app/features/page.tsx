'use client';

import Link from 'next/link';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">
            QuizGod
          </Link>
          <div className="flex gap-4">
            <Link href="/premium" className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:scale-105 transition-all">
              View Pricing
            </Link>
            <Link href="/terms" className="px-4 py-2 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-all">
              Legal
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            QuizGod <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Features</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
            AI-powered quiz platform for students and educators. Create unlimited quizzes, track progress, and learn smarter.
          </p>
          <div className="flex flex-wrap gap-4 justify-center text-sm text-slate-400">
            <div>🔒 Secure & Private</div>
            <div>✅ HTTPS Enabled</div>
            <div>📧 Support: quizgod25@gmail.com</div>
          </div>
        </div>

        {/* Pricing Overview */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-white text-center mb-12">Transparent Pricing</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border-2 border-white/10">
              <h3 className="text-3xl font-bold text-white mb-4">Free Plan</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-6xl font-bold text-white">$0</span>
                <span className="text-slate-400 text-xl">/forever</span>
              </div>
              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span className="text-slate-300">5 quiz creations per month</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span className="text-slate-300">3 AI generations per month</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span className="text-slate-300">Access to public quizzes</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span className="text-slate-300">Basic storage (100MB)</span>
                </div>
              </div>
            </div>

            {/* Premium Plan */}
            <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-2xl p-8 border-2 border-purple-400/50 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-bold">
                🔥 MOST POPULAR
              </div>
              <h3 className="text-3xl font-bold text-white mb-4 mt-4">Premium Plan</h3>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-6xl font-bold text-white">$5</span>
                <span className="text-slate-300 text-xl">/month</span>
              </div>
              <div className="text-green-400 font-semibold mb-6">or $50/year (Save 17%)</div>
              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span className="text-white font-semibold">Unlimited AI quiz generation</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span className="text-white font-semibold">Unlimited quiz creation</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span className="text-white font-semibold">Advanced question types</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span className="text-white font-semibold">Custom timer settings</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span className="text-white font-semibold">Live multiplayer quizzes</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span className="text-white font-semibold">Progress tracking & analytics</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span className="text-white font-semibold">Priority support</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span className="text-white font-semibold">Unlimited cloud storage</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-white text-center mb-12">Key Features & Deliverables</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-purple-400/50 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center text-4xl mb-6">
                🤖
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">AI Quiz Generation</h3>
              <p className="text-slate-300 mb-4">
                Upload PDFs, documents, or text and let AI automatically create comprehensive quizzes with multiple question types.
              </p>
              <ul className="text-slate-400 space-y-2 text-sm">
                <li>• PDF upload support</li>
                <li>• Smart question extraction</li>
                <li>• Customizable difficulty</li>
                <li>• Multiple formats supported</li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-purple-400/50 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center text-4xl mb-6">
                ✏️
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Manual Quiz Creator</h3>
              <p className="text-slate-300 mb-4">
                Create custom quizzes with full control over questions, answers, timing, and difficulty settings.
              </p>
              <ul className="text-slate-400 space-y-2 text-sm">
                <li>• Multiple choice questions</li>
                <li>• True/False questions</li>
                <li>• Fill-in-the-blank</li>
                <li>• Short answer questions</li>
                <li>• Custom timer per quiz</li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-purple-400/50 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center text-4xl mb-6">
                👥
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Live Multiplayer</h3>
              <p className="text-slate-300 mb-4">
                Host real-time quiz sessions with multiple participants. Perfect for classrooms and remote learning.
              </p>
              <ul className="text-slate-400 space-y-2 text-sm">
                <li>• Real-time scoring</li>
                <li>• Live leaderboards</li>
                <li>• Host controls</li>
                <li>• Instant feedback</li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-purple-400/50 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center text-4xl mb-6">
                📊
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Progress Analytics</h3>
              <p className="text-slate-300 mb-4">
                Detailed insights into student performance, learning patterns, and quiz statistics.
              </p>
              <ul className="text-slate-400 space-y-2 text-sm">
                <li>• Performance tracking</li>
                <li>• Learning streaks</li>
                <li>• Score history</li>
                <li>• Subject analytics</li>
              </ul>
            </div>

            {/* Feature 5 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-purple-400/50 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center text-4xl mb-6">
                🏫
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Class Management</h3>
              <p className="text-slate-300 mb-4">
                Create and manage classes, assign quizzes, track student progress, and view class-wide analytics.
              </p>
              <ul className="text-slate-400 space-y-2 text-sm">
                <li>• Create multiple classes</li>
                <li>• Student enrollment</li>
                <li>• Quiz assignments</li>
                <li>• Class leaderboards</li>
              </ul>
            </div>

            {/* Feature 6 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-purple-400/50 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-4xl mb-6">
                🎯
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Subject Organization</h3>
              <p className="text-slate-300 mb-4">
                Organize quizzes by subject, topic, or custom categories for easy management and discovery.
              </p>
              <ul className="text-slate-400 space-y-2 text-sm">
                <li>• Subject categorization</li>
                <li>• Topic tagging</li>
                <li>• Smart search</li>
                <li>• Custom folders</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Company & Contact Info */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 mb-12">
          <h2 className="text-3xl font-bold text-white mb-6">Contact & Company Information</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">QuizGod</h3>
              <div className="space-y-2 text-slate-300">
                <p><strong className="text-white">Company:</strong> QuizGod</p>
                <p><strong className="text-white">Website:</strong> <a href="https://quizgod-swart.vercel.app" className="text-purple-400 hover:text-purple-300">https://quizgod-swart.vercel.app</a></p>
                <p><strong className="text-white">Email:</strong> <a href="mailto:quizgod25@gmail.com" className="text-purple-400 hover:text-purple-300">quizgod25@gmail.com</a></p>
                <p><strong className="text-white">Secure:</strong> ✅ SSL/HTTPS Enabled</p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Legal & Policies</h3>
              <div className="space-y-3">
                <Link href="/terms" className="block text-purple-400 hover:text-purple-300 transition-colors">
                  📜 Terms of Service →
                </Link>
                <Link href="/terms" className="block text-purple-400 hover:text-purple-300 transition-colors">
                  🔒 Privacy Policy →
                </Link>
                <Link href="/terms" className="block text-purple-400 hover:text-purple-300 transition-colors">
                  💰 Refund Policy →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/premium" className="inline-block px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105">
            View Full Pricing Details →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-900/50 backdrop-blur-sm mt-20">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-slate-400 text-sm">
          <p className="mb-2">© 2025 QuizGod. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Refund Policy</Link>
            <a href="mailto:quizgod25@gmail.com" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
