'use client';

import SideNav from '@/components/NavBar';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <SideNav />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Refund Policy</h1>
          <p className="text-slate-300">
            <strong>Company:</strong> QuizGod | <strong>Contact:</strong> quizgod25@gmail.com
          </p>
          <p className="text-slate-400 text-sm mt-2">
            Effective Date: January 1, 2025 | Last Updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 space-y-8">
          
          {/* Overview */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Refund Policy Overview</h2>
            <div className="text-slate-300 space-y-3">
              <p>
                At QuizGod, we strive to provide exceptional service. This refund policy outlines the terms and 
                conditions under which refunds are provided for Premium subscriptions. By purchasing a subscription, 
                you agree to this policy.
              </p>
              <p>
                <strong>Payment Processing:</strong> All payments are processed by Paddle.com Market Ltd., 
                our Merchant of Record. Refund requests are handled in accordance with Paddle's policies and 
                applicable consumer protection laws.
              </p>
            </div>
          </section>

          {/* Premium Subscriptions */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Premium Subscription Pricing</h2>
            <div className="text-slate-300 space-y-3">
              <div className="bg-white/5 rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Monthly Plan</h3>
                  <p><strong>Price:</strong> $5.00 USD per month</p>
                  <p><strong>Billing:</strong> Charged monthly on your subscription date</p>
                  <p><strong>Cancellation:</strong> Cancel anytime; access continues until period ends</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Annual Plan</h3>
                  <p><strong>Price:</strong> $50.00 USD per year (Save 17%)</p>
                  <p><strong>Billing:</strong> Charged annually on your subscription date</p>
                  <p><strong>Cancellation:</strong> Cancel anytime; access continues until period ends</p>
                </div>
              </div>
            </div>
          </section>

          {/* 14-Day Money-Back Guarantee */}
          <section className="bg-green-500/10 rounded-lg p-6 border border-green-400/30">
            <h2 className="text-2xl font-bold text-white mb-4">3. 14-Day Money-Back Guarantee</h2>
            <div className="text-slate-300 space-y-3">
              <p>
                In accordance with Paddle's Buyer Terms and our commitment to customer satisfaction, we offer a 
                <strong> 14-day money-back guarantee</strong> for all Premium subscriptions (both monthly and annual plans). 
                Customers can cancel their agreement and return the product within 14 days of purchase for a full refund.
              </p>
              
              <div className="mt-4">
                <h3 className="text-xl font-semibold text-white mb-2">Eligibility Requirements:</h3>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Request must be made within 14 calendar days of the initial subscription purchase</li>
                  <li>Applies to all Premium subscriptions (first-time purchases and upgrades)</li>
                  <li>Does NOT apply to subscription renewals (monthly or annual)</li>
                  <li>Refund must be requested via email to quizgod25@gmail.com or through Paddle support</li>
                </ul>
              </div>

              <div className="mt-4">
                <h3 className="text-xl font-semibold text-white mb-2">What You'll Receive:</h3>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Full refund of the subscription fee paid</li>
                  <li>Refund processed within 5-10 business days to your original payment method</li>
                  <li>Premium access revoked immediately upon refund approval</li>
                </ul>
              </div>

              <div className="mt-4 bg-blue-500/10 rounded p-4 border border-blue-400/30">
                <p className="text-sm">
                  <strong>Why We Offer 14 Days:</strong> This policy follows Paddle's buyer protection framework 
                  and serves as an effective measure to avoid chargebacks and the fees that these incur. We believe 
                  in giving customers adequate time to evaluate our Premium features risk-free.
                </p>
              </div>
            </div>
          </section>

          {/* Subscription Renewals */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Subscription Renewals</h2>
            <div className="text-slate-300 space-y-3">
              <p>
                <strong>Automatic Renewal:</strong> Premium subscriptions renew automatically unless canceled 
                before the renewal date. You will be charged the then-current subscription price.
              </p>
              <p>
                <strong>Renewal Refunds:</strong> Subscription renewals (both monthly and annual) are 
                <strong> NOT eligible for refunds</strong>. The 7-day money-back guarantee applies ONLY 
                to initial purchases, not renewals.
              </p>
              <p>
                <strong>Cancellation:</strong> You may cancel your subscription at any time through your account 
                settings or by contacting quizgod25@gmail.com. Cancellation takes effect at the end of your 
                current billing period—you will NOT be charged for the next period.
              </p>
            </div>
          </section>

          {/* Non-Refundable Situations */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Non-Refundable Situations</h2>
            <div className="text-slate-300 space-y-3">
              <p>Refunds will NOT be issued in the following cases:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>After 7 Days:</strong> Requests made more than 7 days after the initial purchase</li>
                <li><strong>Renewals:</strong> Automatic monthly or annual subscription renewals</li>
                <li><strong>Partial Periods:</strong> Unused time remaining in a subscription period</li>
                <li><strong>Account Violations:</strong> Accounts suspended or terminated for violating our Terms of Service</li>
                <li><strong>Chargebacks:</strong> Disputed charges that result in a chargeback (may result in account termination)</li>
                <li><strong>Change of Mind:</strong> Refund requests after the 7-day guarantee period has expired</li>
                <li><strong>Previously Refunded:</strong> Accounts that have already received a refund for the same plan type</li>
              </ul>
            </div>
          </section>

          {/* How to Request a Refund */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. How to Request a Refund</h2>
            <div className="text-slate-300 space-y-3">
              <p>To request a refund within the 7-day guarantee period, follow these steps:</p>
              
              <div className="bg-white/5 rounded-lg p-6 mt-4 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Step 1: Contact Us</h3>
                  <p>Email us at <strong>quizgod25@gmail.com</strong> with the subject line: "Refund Request"</p>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Step 2: Include Details</h3>
                  <p>Provide the following information in your email:</p>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Your account email address</li>
                    <li>Purchase date and transaction ID (found in your Paddle receipt email)</li>
                    <li>Subscription type (Monthly or Annual)</li>
                    <li>Brief reason for the refund request (optional but helpful)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Step 3: Processing</h3>
                  <p>We will review your request within 24-48 hours (business days) and respond via email.</p>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Step 4: Refund Issued</h3>
                  <p>
                    If approved, the refund will be processed to your original payment method within 5-10 business 
                    days. You will receive a confirmation email from Paddle once the refund is complete.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Cancellation Policy */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Cancellation Policy</h2>
            <div className="text-slate-300 space-y-3">
              <p>
                You may cancel your Premium subscription at any time. Cancellation does NOT entitle you to a refund 
                (except within the 7-day guarantee period).
              </p>
              
              <div className="mt-4">
                <h3 className="text-xl font-semibold text-white mb-2">How to Cancel:</h3>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Log in to your QuizGod account</li>
                  <li>Navigate to Account Settings → Subscription</li>
                  <li>Click "Cancel Subscription" and confirm</li>
                  <li>Alternatively, email quizgod25@gmail.com with "Cancel Subscription" in the subject line</li>
                </ul>
              </div>

              <div className="mt-4">
                <h3 className="text-xl font-semibold text-white mb-2">After Cancellation:</h3>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Premium access continues until the end of your current billing period</li>
                  <li>You will NOT be charged for the next billing cycle</li>
                  <li>Your quizzes and data remain accessible (subject to Free plan limits)</li>
                  <li>You can reactivate Premium at any time</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Payment Issues */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Payment Issues and Failed Charges</h2>
            <div className="text-slate-300 space-y-3">
              <p>
                If a subscription renewal payment fails, we will attempt to charge your payment method up to 3 times 
                over 7 days. If all attempts fail:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Your Premium subscription will be automatically canceled</li>
                <li>Access will revert to the Free plan</li>
                <li>You will receive email notifications about the failed payment</li>
                <li>You may reactivate Premium by updating your payment method</li>
              </ul>
              <p className="mt-4">
                <strong>Note:</strong> Failed payment attempts do NOT qualify for refunds, as no successful charge 
                was processed.
              </p>
            </div>
          </section>

          {/* Disputed Charges */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Disputed Charges and Chargebacks</h2>
            <div className="text-slate-300 space-y-3">
              <p>
                If you dispute a charge with your bank or credit card company (chargeback) instead of contacting us 
                first, please be aware:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Your QuizGod account may be immediately suspended or terminated</li>
                <li>Chargebacks are expensive and harm small businesses</li>
                <li>We encourage you to contact us at quizgod25@gmail.com FIRST to resolve billing issues</li>
                <li>If a chargeback is filed, we will provide transaction records to your bank</li>
              </ul>
              <p className="mt-4">
                <strong>Important:</strong> Filing a chargeback does NOT guarantee a refund and may result in account 
                closure.
              </p>
            </div>
          </section>

          {/* Free Plan */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Free Plan (No Refunds Applicable)</h2>
            <div className="text-slate-300 space-y-3">
              <p>
                The QuizGod Free plan is provided at no cost and does not involve any payments. Therefore, refunds 
                do not apply to Free accounts.
              </p>
              <p>
                Free users have access to:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>5 quiz creations per month</li>
                <li>3 AI quiz generations per month</li>
                <li>Basic features and storage (100MB)</li>
              </ul>
            </div>
          </section>

          {/* Changes to Pricing */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. Changes to Pricing</h2>
            <div className="text-slate-300 space-y-3">
              <p>
                We reserve the right to change subscription pricing at any time. If we increase prices:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Existing subscribers will receive at least 30 days' notice via email</li>
                <li>New pricing will apply to renewals AFTER the notice period</li>
                <li>You may cancel before the price change takes effect to avoid the increase</li>
                <li>Current billing period prices remain unchanged</li>
              </ul>
            </div>
          </section>

          {/* Contact for Questions */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">12. Questions About Refunds</h2>
            <div className="text-slate-300 space-y-3">
              <p>If you have questions about this refund policy or need assistance, contact us:</p>
              <div className="bg-white/5 rounded-lg p-4 mt-4">
                <p><strong>Email:</strong> quizgod25@gmail.com</p>
                <p><strong>Subject Line:</strong> "Refund Question" or "Refund Request"</p>
                <p><strong>Company:</strong> QuizGod</p>
                <p><strong>Website:</strong> https://quizgod-swart.vercel.app</p>
                <p><strong>Response Time:</strong> Within 24-48 hours (business days: Mon-Fri, 9AM-6PM EST)</p>
              </div>
            </div>
          </section>

          {/* Policy Changes */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">13. Changes to This Refund Policy</h2>
            <div className="text-slate-300 space-y-3">
              <p>
                We may update this refund policy from time to time. Changes will be posted on this page with an 
                updated "Last Updated" date. Material changes will be communicated via email.
              </p>
              <p>
                Continued use of QuizGod after changes constitutes acceptance of the updated policy.
              </p>
            </div>
          </section>

          {/* Legal */}
          <section className="bg-purple-500/10 rounded-lg p-6 border border-purple-400/30">
            <h2 className="text-2xl font-bold text-white mb-4">14. Legal and Consumer Rights</h2>
            <div className="text-slate-300 space-y-3">
              <p>
                This refund policy does not affect your statutory rights under applicable consumer protection laws. 
                In some jurisdictions, you may be entitled to additional refund rights beyond those outlined here.
              </p>
              <p>
                <strong>EU/EEA Users:</strong> You have a 14-day right of withdrawal under EU Consumer Rights 
                Directive. Contact us to exercise this right.
              </p>
              <p>
                <strong>Governing Law:</strong> This policy is governed by the laws of the jurisdiction where 
                QuizGod operates, without regard to conflict of law principles.
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
  );
}
