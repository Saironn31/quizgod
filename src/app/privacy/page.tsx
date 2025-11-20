'use client';

import SideNav from '@/components/SideNav';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-950">
      <SideNav />
      
      <div className="md:ml-64 min-h-screen p-4 md:p-8 pb-32 md:pb-8">
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-slate-300">
            <strong>Company:</strong> QuizGod | <strong>Contact:</strong> quizgod25@gmail.com
          </p>
          <p className="text-slate-400 text-sm mt-2">
            Effective Date: January 1, 2025 | Last Updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 space-y-8">
          
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
            <div className="text-slate-300 space-y-3">
              <p>
                Welcome to QuizGod. We respect your privacy and are committed to protecting your personal data. 
                This privacy policy explains how we collect, use, and safeguard your information when you use our 
                AI-powered quiz platform.
              </p>
              <p>
                QuizGod is operated by QuizGod, accessible at https://quizgod-swart.vercel.app. 
                For any questions regarding this policy, please contact us at quizgod25@gmail.com.
              </p>
            </div>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
            <div className="text-slate-300 space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">2.1 Account Information</h3>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Email address (for account creation and authentication)</li>
                  <li>Display name (optional, for personalization)</li>
                  <li>Profile picture (optional, via authentication provider)</li>
                  <li>Password (encrypted and never stored in plain text)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">2.2 Usage Data</h3>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Quizzes created, taken, and shared</li>
                  <li>Quiz performance and scores</li>
                  <li>Learning progress and analytics</li>
                  <li>PDF uploads for AI quiz generation (temporarily processed, not permanently stored)</li>
                  <li>Device information (browser type, operating system)</li>
                  <li>IP address and approximate location</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">2.3 Payment Information</h3>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Payment information is processed by <strong>Paddle</strong> (our Merchant of Record)</li>
                  <li>We do NOT store credit card numbers or payment details</li>
                  <li>We receive only subscription status and transaction IDs from Paddle</li>
                  <li>Billing details are managed securely by Paddle in compliance with PCI-DSS standards</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
            <div className="text-slate-300 space-y-3">
              <p>We use your personal data for the following purposes:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Service Delivery:</strong> To provide quiz creation, AI generation, and learning features</li>
                <li><strong>Account Management:</strong> To authenticate users and manage subscriptions</li>
                <li><strong>Analytics:</strong> To track learning progress and provide performance insights</li>
                <li><strong>Communication:</strong> To send service updates, subscription notifications, and support responses</li>
                <li><strong>Security:</strong> To detect fraud, prevent abuse, and ensure platform integrity</li>
                <li><strong>Improvement:</strong> To analyze usage patterns and enhance our services</li>
                <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
              </ul>
            </div>
          </section>

          {/* Data Sharing and Disclosure */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Data Sharing and Disclosure</h2>
            <div className="text-slate-300 space-y-4">
              <p>We do NOT sell your personal data. We may share information with:</p>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">4.1 Service Providers</h3>
                <ul className="list-disc ml-6 space-y-2">
                  <li><strong>Firebase/Google Cloud:</strong> Database hosting and authentication</li>
                  <li><strong>Paddle:</strong> Payment processing and subscription management</li>
                  <li><strong>Groq/AI Providers:</strong> AI quiz generation (data is not retained by providers)</li>
                  <li><strong>Vercel:</strong> Web hosting and infrastructure</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">4.2 Legal Requirements</h3>
                <p>We may disclose your information if required by law, court order, or government request.</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">4.3 Business Transfers</h3>
                <p>
                  In the event of a merger, acquisition, or sale of assets, your data may be transferred 
                  to the new entity, subject to the same privacy protections.
                </p>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Data Security</h2>
            <div className="text-slate-300 space-y-3">
              <p>We implement industry-standard security measures to protect your data:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Encryption:</strong> All data transmitted via HTTPS/TLS encryption</li>
                <li><strong>Secure Storage:</strong> Firebase Firestore with access controls and encryption at rest</li>
                <li><strong>Authentication:</strong> Firebase Authentication with secure password hashing</li>
                <li><strong>Access Controls:</strong> Strict database rules limiting data access to authorized users only</li>
                <li><strong>Regular Updates:</strong> Security patches and dependency updates applied regularly</li>
              </ul>
              <p className="mt-4">
                While we strive to protect your data, no method of transmission over the internet is 100% secure. 
                We cannot guarantee absolute security.
              </p>
            </div>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Data Retention</h2>
            <div className="text-slate-300 space-y-3">
              <p>We retain your personal data for as long as necessary to:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Maintain your account and provide services</li>
                <li>Comply with legal and tax obligations</li>
                <li>Resolve disputes and enforce agreements</li>
              </ul>
              <p className="mt-4">
                <strong>Account Deletion:</strong> You may request account deletion at any time by contacting 
                quizgod25@gmail.com. Upon deletion, we will remove your personal data within 30 days, except 
                where retention is required by law.
              </p>
              <p>
                <strong>PDF Uploads:</strong> Uploaded PDFs for AI quiz generation are processed in memory and 
                NOT permanently stored on our servers.
              </p>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Your Privacy Rights</h2>
            <div className="text-slate-300 space-y-3">
              <p>Depending on your location, you may have the following rights:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Data Portability:</strong> Export your quiz data in a machine-readable format</li>
                <li><strong>Objection:</strong> Object to certain data processing activities</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent for optional data uses</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, contact us at quizgod25@gmail.com. We will respond within 30 days.
              </p>
            </div>
          </section>

          {/* Cookies and Tracking */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Cookies and Tracking Technologies</h2>
            <div className="text-slate-300 space-y-3">
              <p>We use the following technologies:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Essential Cookies:</strong> Required for authentication and core functionality</li>
                <li><strong>Firebase Analytics:</strong> To understand usage patterns and improve services</li>
                <li><strong>Local Storage:</strong> To save theme preferences and session data</li>
              </ul>
              <p className="mt-4">
                You can disable cookies in your browser settings, but this may limit functionality. 
                We do NOT use third-party advertising cookies.
              </p>
            </div>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Children's Privacy</h2>
            <div className="text-slate-300 space-y-3">
              <p>
                QuizGod is intended for users aged 13 and older. We do not knowingly collect personal information 
                from children under 13. If you believe a child has provided us with personal data, please contact 
                us immediately at quizgod25@gmail.com, and we will delete it.
              </p>
              <p>
                For users under 18, we recommend parental supervision when using the platform.
              </p>
            </div>
          </section>

          {/* International Data Transfers */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. International Data Transfers</h2>
            <div className="text-slate-300 space-y-3">
              <p>
                Your data may be processed in the United States or other countries where our service providers 
                operate. We ensure appropriate safeguards are in place, including:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Standard Contractual Clauses (SCCs) with service providers</li>
                <li>Data Processing Agreements (DPAs) with third parties</li>
                <li>Compliance with GDPR, CCPA, and other applicable privacy laws</li>
              </ul>
            </div>
          </section>

          {/* Third-Party Links */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. Third-Party Links</h2>
            <div className="text-slate-300 space-y-3">
              <p>
                Our platform may contain links to external websites (e.g., authentication providers). 
                We are not responsible for the privacy practices of third-party sites. Please review their 
                privacy policies before providing personal information.
              </p>
            </div>
          </section>

          {/* Changes to This Policy */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">12. Changes to This Privacy Policy</h2>
            <div className="text-slate-300 space-y-3">
              <p>
                We may update this privacy policy periodically. Changes will be posted on this page with an 
                updated "Last Updated" date. Material changes will be communicated via email or in-app notification.
              </p>
              <p>
                Continued use of QuizGod after changes constitutes acceptance of the updated policy.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">13. Contact Us</h2>
            <div className="text-slate-300 space-y-3">
              <p>For privacy-related questions, concerns, or requests, contact us:</p>
              <div className="bg-white/5 rounded-lg p-4 mt-4">
                <p><strong>Email:</strong> quizgod25@gmail.com</p>
                <p><strong>Company:</strong> QuizGod</p>
                <p><strong>Website:</strong> https://quizgod-swart.vercel.app</p>
                <p><strong>Response Time:</strong> Within 24-48 hours (business days)</p>
              </div>
            </div>
          </section>

          {/* GDPR/CCPA Compliance */}
          <section className="bg-purple-500/10 rounded-lg p-6 border border-purple-400/30">
            <h2 className="text-2xl font-bold text-white mb-4">14. GDPR & CCPA Compliance</h2>
            <div className="text-slate-300 space-y-3">
              <p>
                <strong>For EU Users (GDPR):</strong> You have the right to access, correct, delete, restrict 
                processing, data portability, and lodge a complaint with a supervisory authority.
              </p>
              <p>
                <strong>For California Users (CCPA):</strong> You have the right to know what personal information 
                is collected, request deletion, opt-out of sale (we do NOT sell data), and non-discrimination.
              </p>
              <p className="mt-4">
                To exercise these rights, email quizgod25@gmail.com with "GDPR Request" or "CCPA Request" 
                in the subject line.
              </p>
            </div>
          </section>

        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <a 
            href="/" 
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            ← Back to Home
          </a>
        </div>
        </div>
      </div>
    </div>
  );
}
