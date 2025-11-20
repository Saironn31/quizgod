'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import SideNav from '@/components/SideNav';

export default function TermsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<'terms' | 'privacy' | 'refund'>('terms');

  return (
    <div className="min-h-screen bg-slate-950">
      <SideNav />
      <div className="md:ml-64 min-h-screen">
        <div className="p-4 md:p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Legal & Policies
          </h1>
          <p className="text-xl text-slate-300">
            Everything you need to know about using QuizGod
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          <button
            onClick={() => setActiveSection('terms')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeSection === 'terms'
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            📜 Terms of Service
          </button>
          <button
            onClick={() => setActiveSection('privacy')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeSection === 'privacy'
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            🔒 Privacy Policy
          </button>
          <button
            onClick={() => setActiveSection('refund')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeSection === 'refund'
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            💰 Refund Policy
          </button>
        </div>

        {/* Content */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 md:p-12 border-2 border-white/10">
          {/* Terms of Service */}
          {activeSection === 'terms' && (
            <div className="prose prose-invert max-w-none">
              <div className="mb-8">
                <p className="text-sm text-slate-400 mb-2">Last Updated: November 20, 2025</p>
                <p className="text-sm text-slate-400 mb-4">Company: QuizGod | Contact: quizgod25@gmail.com</p>
                <h2 className="text-3xl font-bold text-white mb-6">Terms of Service</h2>
                <p className="text-slate-300 leading-relaxed mb-6">
                  These Terms of Service ("Terms") govern your access to and use of QuizGod, operated by QuizGod ("we," "us," or "our"). By using our service, you agree to these terms.
                </p>
              </div>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">1. About QuizGod</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  <strong className="text-white">Service Provider:</strong> QuizGod<br />
                  <strong className="text-white">Contact Email:</strong> quizgod25@gmail.com<br />
                  <strong className="text-white">Website:</strong> https://quizgod-swart.vercel.app
                </p>
                <p className="text-slate-300 leading-relaxed mb-4">
                  QuizGod is an AI-powered quiz creation and learning platform that helps students and educators create, share, and take interactive quizzes.
                </p>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">2. Acceptance of Terms</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  By accessing and using QuizGod ("the Service"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use the Service.
                </p>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">3. Description of Service & Pricing</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  QuizGod offers two service tiers:
                </p>
                <div className="bg-white/5 rounded-xl p-6 mb-4">
                  <h4 className="text-xl font-bold text-white mb-3">Free Tier</h4>
                  <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                    <li>Basic quiz creation (5 quizzes per month)</li>
                    <li>AI quiz generation (3 per month)</li>
                    <li>Access to public quizzes</li>
                    <li>Basic storage (100MB)</li>
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl p-6 border-2 border-purple-400/50">
                  <h4 className="text-xl font-bold text-white mb-3">Premium Tier</h4>
                  <p className="text-slate-300 mb-3">
                    <strong className="text-white">$5.00 USD/month</strong> or <strong className="text-white">$50.00 USD/year</strong> (17% savings)
                  </p>
                  <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                    <li>Unlimited AI quiz generation</li>
                    <li>Unlimited quiz creation</li>
                    <li>Advanced question types (Multiple choice, True/False, Fill-in-blank, Short answer)</li>
                    <li>Custom timer settings</li>
                    <li>Live multiplayer quizzes</li>
                    <li>Progress tracking & analytics</li>
                    <li>Custom quiz themes</li>
                    <li>Export quiz results</li>
                    <li>Priority support</li>
                    <li>Unlimited cloud storage</li>
                    <li>Early access to new features</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">4. User Accounts</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  To access certain features, you must create an account. You agree to:
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>Be responsible for all activities under your account</li>
                  <li>Not share your account with others</li>
                </ul>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">5. Acceptable Use</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  You agree NOT to use the Service to:
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                  <li>Violate any laws or regulations</li>
                  <li>Infringe on intellectual property rights</li>
                  <li>Upload malicious code or viruses</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Create inappropriate or offensive content</li>
                  <li>Attempt to gain unauthorized access to the Service</li>
                  <li>Reverse engineer or copy the Service</li>
                  <li>Use automated tools to extract data (scraping)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">6. Content Ownership</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  <strong className="text-white">Your Content:</strong> You retain ownership of all quizzes and content you create. By uploading content, you grant QuizGod a license to store, display, and distribute your content as necessary to provide the Service.
                </p>
                <p className="text-slate-300 leading-relaxed mb-4">
                  <strong className="text-white">Our Content:</strong> The Service, including its design, features, and underlying technology, is owned by QuizGod and protected by copyright and other intellectual property laws.
                </p>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">7. Premium Subscriptions</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Premium subscriptions provide access to additional features. Subscriptions are:
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                  <li>Billed monthly or yearly based on your selection</li>
                  <li>Auto-renewed unless cancelled before the renewal date</li>
                  <li>Subject to our Refund Policy (see separate section)</li>
                  <li>Non-transferable between accounts</li>
                </ul>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">8. Termination</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  We reserve the right to suspend or terminate your account if you violate these terms. You may also delete your account at any time through your account settings.
                </p>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">8. Disclaimers</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We do not guarantee:
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                  <li>Uninterrupted or error-free service</li>
                  <li>Accuracy of AI-generated content</li>
                  <li>Security of data transmission</li>
                  <li>Compatibility with all devices</li>
                </ul>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">9. Limitation of Liability</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  QuizGod shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service. Our total liability shall not exceed the amount you paid for the Service in the past 12 months.
                </p>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">10. Changes to Terms</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  We may modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms. We will notify users of significant changes via email or in-app notification.
                </p>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">11. Contact Information</h3>
                <p className="text-slate-300 leading-relaxed">
                  For questions about these terms, please contact us at: <a href="mailto:support@quizgod.com" className="text-purple-400 hover:text-purple-300">support@quizgod.com</a>
                </p>
              </section>
            </div>
          )}

          {/* Privacy Policy */}
          {activeSection === 'privacy' && (
            <div className="prose prose-invert max-w-none">
              <div className="mb-8">
                <p className="text-sm text-slate-400 mb-4">Last Updated: November 20, 2025</p>
                <h2 className="text-3xl font-bold text-white mb-6">Privacy Policy</h2>
              </div>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  <strong className="text-white">Account Information:</strong>
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mb-4">
                  <li>Email address</li>
                  <li>Display name</li>
                  <li>Profile picture (optional)</li>
                  <li>Authentication credentials</li>
                </ul>
                <p className="text-slate-300 leading-relaxed mb-4">
                  <strong className="text-white">Usage Information:</strong>
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mb-4">
                  <li>Quizzes created and taken</li>
                  <li>Quiz scores and performance data</li>
                  <li>Documents uploaded for AI processing</li>
                  <li>Interaction with features and pages</li>
                  <li>Device and browser information</li>
                </ul>
                <p className="text-slate-300 leading-relaxed mb-4">
                  <strong className="text-white">Payment Information:</strong>
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                  <li>Processed securely through third-party payment providers</li>
                  <li>We do not store full credit card numbers</li>
                </ul>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  We use your information to:
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                  <li>Provide and improve the Service</li>
                  <li>Process AI quiz generation from your documents</li>
                  <li>Track your progress and quiz history</li>
                  <li>Send important updates and notifications</li>
                  <li>Process payments and manage subscriptions</li>
                  <li>Prevent fraud and ensure security</li>
                  <li>Provide customer support</li>
                  <li>Analyze usage patterns to improve features</li>
                </ul>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">3. Data Sharing</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  We do NOT sell your personal information. We may share data with:
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                  <li><strong className="text-white">Service Providers:</strong> Firebase (authentication, database), AI providers (quiz generation)</li>
                  <li><strong className="text-white">Payment Processors:</strong> For handling subscription payments</li>
                  <li><strong className="text-white">Legal Requirements:</strong> When required by law or to protect our rights</li>
                  <li><strong className="text-white">Public Quizzes:</strong> Content you mark as public is visible to other users</li>
                </ul>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">4. Data Storage and Security</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Your data is stored securely using industry-standard encryption. We implement:
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                  <li>Encrypted data transmission (HTTPS/SSL)</li>
                  <li>Secure authentication via Firebase</li>
                  <li>Regular security audits</li>
                  <li>Access controls and monitoring</li>
                  <li>Automatic backups</li>
                </ul>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">5. AI Processing</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  When you upload documents for AI quiz generation:
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                  <li>Documents are processed by third-party AI providers (Groq, OpenAI, etc.)</li>
                  <li>Text is extracted and sent to AI APIs for quiz generation</li>
                  <li>Documents are not permanently stored on AI provider servers</li>
                  <li>Generated content is stored in your account</li>
                </ul>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">6. Cookies and Tracking</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  We use cookies and similar technologies for:
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                  <li>Authentication and session management</li>
                  <li>Remembering your preferences</li>
                  <li>Analytics to improve the Service</li>
                  <li>Security and fraud prevention</li>
                </ul>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">7. Your Rights</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                  <li><strong className="text-white">Access:</strong> Request a copy of your data</li>
                  <li><strong className="text-white">Correction:</strong> Update inaccurate information</li>
                  <li><strong className="text-white">Deletion:</strong> Delete your account and associated data</li>
                  <li><strong className="text-white">Export:</strong> Download your quiz data</li>
                  <li><strong className="text-white">Opt-out:</strong> Unsubscribe from marketing emails</li>
                </ul>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">8. Children's Privacy</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  The Service is not intended for children under 13. We do not knowingly collect information from children under 13. If you believe a child has provided us with personal information, please contact us immediately.
                </p>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">9. International Users</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Your information may be transferred to and processed in countries other than your own. By using the Service, you consent to such transfers.
                </p>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">10. Changes to Privacy Policy</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  We may update this policy periodically. We will notify you of significant changes via email or through the Service. Continued use after changes constitutes acceptance.
                </p>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">11. Contact Us</h3>
                <p className="text-slate-300 leading-relaxed">
                  For privacy concerns or requests: <a href="mailto:privacy@quizgod.com" className="text-purple-400 hover:text-purple-300">privacy@quizgod.com</a>
                </p>
              </section>
            </div>
          )}

          {/* Refund Policy */}
          {activeSection === 'refund' && (
            <div className="prose prose-invert max-w-none">
              <div className="mb-8">
                <p className="text-sm text-slate-400 mb-4">Last Updated: November 20, 2025</p>
                <h2 className="text-3xl font-bold text-white mb-6">Refund Policy</h2>
              </div>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">1. 30-Day Money-Back Guarantee</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  We offer a 30-day money-back guarantee for all premium subscriptions. If you're not satisfied with QuizGod Premium, you can request a full refund within 30 days of your initial purchase.
                </p>
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 my-4">
                  <p className="text-green-300 font-semibold">
                    ✅ This applies to your FIRST payment only (monthly or yearly)
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">2. Refund Eligibility</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  <strong className="text-white">You ARE eligible for a refund if:</strong>
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mb-4">
                  <li>It's within 30 days of your initial subscription purchase</li>
                  <li>You have not violated our Terms of Service</li>
                  <li>You are requesting your first refund with us</li>
                  <li>Technical issues prevented you from using the Service (and we couldn't resolve them)</li>
                </ul>
                <p className="text-slate-300 leading-relaxed mb-4">
                  <strong className="text-white">You are NOT eligible for a refund if:</strong>
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                  <li>More than 30 days have passed since purchase</li>
                  <li>This is a renewal payment (not initial purchase)</li>
                  <li>Your account was terminated for Terms of Service violations</li>
                  <li>You've already received a refund in the past</li>
                  <li>You simply changed your mind after 30 days</li>
                </ul>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">3. Subscription Cancellations</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  You can cancel your subscription at any time:
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                  <li>Go to Account Settings → Subscription</li>
                  <li>Click "Cancel Subscription"</li>
                  <li>You'll retain access until the end of your billing period</li>
                  <li>No further charges will occur</li>
                  <li>Your data remains safe and accessible</li>
                </ul>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 my-4">
                  <p className="text-yellow-300">
                    ⚠️ <strong>Note:</strong> Canceling your subscription does not automatically issue a refund. To request a refund within 30 days, follow the process in section 4.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">4. How to Request a Refund</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  To request a refund within the 30-day window:
                </p>
                <ol className="list-decimal list-inside text-slate-300 space-y-3 ml-4">
                  <li>
                    <strong className="text-white">Email us at:</strong> <a href="mailto:refunds@quizgod.com" className="text-purple-400 hover:text-purple-300">refunds@quizgod.com</a>
                  </li>
                  <li>
                    <strong className="text-white">Include:</strong>
                    <ul className="list-disc list-inside ml-8 mt-2 space-y-1">
                      <li>Your account email address</li>
                      <li>Order/transaction ID (if available)</li>
                      <li>Reason for refund request (optional but helpful)</li>
                    </ul>
                  </li>
                  <li><strong className="text-white">Response time:</strong> We'll respond within 2-3 business days</li>
                  <li><strong className="text-white">Processing:</strong> Approved refunds take 5-10 business days to appear in your account</li>
                </ol>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">5. Partial Refunds</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  In some cases, we may offer partial refunds:
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                  <li>Prolonged service outages affecting your usage</li>
                  <li>Feature downgrades or removals during your billing period</li>
                  <li>Billing errors or duplicate charges</li>
                </ul>
                <p className="text-slate-300 leading-relaxed mt-4">
                  Partial refund amounts are calculated based on usage and time remaining in your billing period.
                </p>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">6. Billing Disputes</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  If you see an unexpected charge:
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                  <li>Contact us BEFORE disputing with your bank/card provider</li>
                  <li>We can often resolve issues immediately</li>
                  <li>Chargebacks may result in account suspension</li>
                  <li>We'll work with you to resolve legitimate billing errors</li>
                </ul>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">7. Promotional Discounts</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  If you used a promotional discount or coupon:
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                  <li>Refunds are issued for the amount you actually paid</li>
                  <li>Promotional credits or free trials are non-refundable</li>
                  <li>Discounts cannot be combined with refund policies</li>
                </ul>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">8. Free Tier</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  The free version of QuizGod is provided "as is" with no refund applicable, as there is no payment involved. Free tier users can upgrade to premium at any time.
                </p>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">9. Account Deletion After Refund</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  After receiving a refund:
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                  <li>Your premium features will be immediately deactivated</li>
                  <li>You'll revert to the free tier</li>
                  <li>Your quiz data and account remain intact</li>
                  <li>You can upgrade again anytime (subject to this policy)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">10. Questions?</h3>
                <p className="text-slate-300 leading-relaxed">
                  Have questions about refunds or billing? Contact us at: <a href="mailto:refunds@quizgod.com" className="text-purple-400 hover:text-purple-300">refunds@quizgod.com</a>
                </p>
                <p className="text-slate-300 leading-relaxed mt-4">
                  We're here to help and want you to be satisfied with QuizGod!
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
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
