"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import AuthModal from "@/components/AuthModal";
import SideNav from '@/components/SideNav';
import AdsterraAd from '@/components/AdsterraAd';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getDoc, doc } from 'firebase/firestore';
import { getAllUserSubjects, getQuizById } from '@/lib/firestore';

export default function HomePage() {
  const [showAuth, setShowAuth] = useState(false);
  const { user, userProfile } = useAuth();
  const [quizRecords, setQuizRecords] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [stats, setStats] = useState({ totalQuizzes: 0, avgScore: 0, streak: 0 });
  const [userSubjects, setUserSubjects] = useState<any[]>([]);
  const [recentActivityWithDetails, setRecentActivityWithDetails] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecordsAndStreak = async () => {
      if (!user?.uid) return;
      setLoadingRecords(true);
      try {
        // Fetch quiz records
        const q = query(
          collection(db, 'quizRecords'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );
        const snap = await getDocs(q);
        const records = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setQuizRecords(records);

        // Fetch loginDates from Firestore
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        let loginDates: string[] = [];
        if (userSnap.exists()) {
          loginDates = userSnap.data().loginDates || [];
        }

        // Calculate login streak
        let streak = 0;
        if (loginDates.length > 0) {
          // Sort dates descending
          const sorted = loginDates.slice().sort((a, b) => b.localeCompare(a));
          let current = new Date();
          for (let i = 0; i < sorted.length; i++) {
            const dateStr = sorted[i];
            const date = new Date(dateStr);
            // Compare only date part
            if (i === 0) {
              // First date: must be today
              const todayStr = current.toISOString().slice(0, 10);
              if (dateStr !== todayStr) break;
              streak = 1;
            } else {
              // Previous date must be yesterday, etc.
              current.setDate(current.getDate() - 1);
              const expectedStr = current.toISOString().slice(0, 10);
              if (dateStr === expectedStr) {
                streak++;
              } else {
                break;
              }
            }
          }
        }

        // Calculate stats
        const total = records.length;
        const avg = total > 0 ? records.reduce((acc: number, r: any) => acc + (r.score || 0), 0) / total : 0;
        setStats({ totalQuizzes: total, avgScore: Math.round(avg), streak });

        // Fetch user's subjects
        const subjects = await getAllUserSubjects(user.uid, user.email || '');
        setUserSubjects(subjects.slice(0, 4)); // Limit to 4 subjects
        
        // Fetch quiz details for recent activity
        const recentRecordsWithDetails = await Promise.all(
          records.slice(0, 3).map(async (record: any) => {
            let maxScore = 1;
            let quizTitle = record.quizTitle || 'Quiz';
            
            if (record.quizId) {
              const quiz = await getQuizById(record.quizId);
              if (quiz) {
                maxScore = quiz.questions?.length || 1;
                quizTitle = quiz.title || quizTitle;
              }
            }
            
            return {
              ...record,
              quizTitle,
              maxScore
            };
          })
        );
        setRecentActivityWithDetails(recentRecordsWithDetails);
      } catch (err) {
        console.error('Failed to fetch quiz records or streak:', err);
      } finally {
        setLoadingRecords(false);
      }
    };
    if (user?.uid) fetchRecordsAndStreak();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <SideNav />
        
        {/* Main Content with proper spacing for SideNav */}
        <div className="md:ml-64 min-h-screen">
          <div className="p-6 md:p-12 pb-24 md:pb-12">
            {/* Landing Page Content */}
            <div className="max-w-6xl mx-auto space-y-12">
              
              {/* Hero Section */}
              <div className="text-center animate-fade-in">
                <div className="mb-8 inline-block">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-400 via-violet-500 to-pink-500 flex items-center justify-center text-white text-5xl font-black animate-bounce-soft shadow-glow">
                    Q
                  </div>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-black mb-6">
                  <span className="gradient-text">QuizGod</span>
                </h1>
                
                <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto">
                  AI-powered quiz platform for students and educators. Create unlimited quizzes, track progress, and learn smarter.
                </p>

                <button
                  onClick={() => setShowAuth(true)}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold text-lg hover:scale-105 transition-all duration-300 shadow-glow"
                >
                  Start Learning Free
                </button>
              </div>

              {/* Product Description & Features */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="text-4xl mb-4">🤖</div>
                  <h3 className="text-xl font-bold text-white mb-2">AI Quiz Generation</h3>
                  <p className="text-slate-300 text-sm">Upload documents and let AI create quizzes automatically. Supports PDFs, text files, and more.</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="text-4xl mb-4">⚡</div>
                  <h3 className="text-xl font-bold text-white mb-2">Custom Quiz Creator</h3>
                  <p className="text-slate-300 text-sm">Create quizzes manually with multiple question types, timers, and difficulty levels.</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="text-4xl mb-4">👥</div>
                  <h3 className="text-xl font-bold text-white mb-2">Live Multiplayer</h3>
                  <p className="text-slate-300 text-sm">Host real-time quiz sessions with students. Track scores and engagement instantly.</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-xl font-bold text-white mb-2">Progress Analytics</h3>
                  <p className="text-slate-300 text-sm">Detailed insights into performance, streaks, and learning patterns.</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-xl font-bold text-white mb-2">Multiple Question Types</h3>
                  <p className="text-slate-300 text-sm">Multiple choice, true/false, fill-in-blank, and short answer questions.</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="text-4xl mb-4">🏫</div>
                  <h3 className="text-xl font-bold text-white mb-2">Class Management</h3>
                  <p className="text-slate-300 text-sm">Create classes, manage students, assign quizzes, and track class performance.</p>
                </div>
              </div>

              {/* Pricing Preview */}
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-4xl font-bold text-white mb-4">Pricing</h2>
                  <p className="text-slate-300 text-lg">Simple, transparent pricing for everyone</p>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border-2 border-white/20">
                <div className="text-center mb-6">
                  <h3 className="text-3xl font-bold text-white mb-4">Free Plan</h3>
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-6xl font-black text-white">$0</span>
                    <span className="text-slate-400 text-xl">USD</span>
                  </div>
                  <p className="text-slate-400">Forever free</p>
                </div>
                <ul className="space-y-3 text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 text-xl mt-0.5">✓</span>
                    <span>5 quiz creations per month</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 text-xl mt-0.5">✓</span>
                    <span>3 AI quiz generations per month</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 text-xl mt-0.5">✓</span>
                    <span>Access to public quizzes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 text-xl mt-0.5">✓</span>
                    <span>Basic storage (100MB)</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-purple-500/30 to-blue-500/30 backdrop-blur-sm rounded-2xl p-8 border-2 border-purple-400/60 relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  🔥 MOST POPULAR
                </div>
                <div className="text-center mb-6 mt-2">
                  <h3 className="text-3xl font-bold text-white mb-4">Premium Plan</h3>
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-6xl font-black text-white">$5</span>
                    <span className="text-white text-xl">USD/month</span>
                  </div>
                  <p className="text-green-400 font-semibold">or $50 USD/year (Save 17%)</p>
                </div>
                <ul className="space-y-3 text-white font-medium">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 text-xl mt-0.5">✓</span>
                    <span>Unlimited AI quiz generation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 text-xl mt-0.5">✓</span>
                    <span>Unlimited quiz creation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 text-xl mt-0.5">✓</span>
                    <span>All advanced question types</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 text-xl mt-0.5">✓</span>
                    <span>Live multiplayer quizzes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 text-xl mt-0.5">✓</span>
                    <span>Progress tracking & analytics</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 text-xl mt-0.5">✓</span>
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 text-xl mt-0.5">✓</span>
                    <span>Unlimited cloud storage</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          </div>

          {/* Company & Contact Info */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Company & Contact Information</h2>
            <div className="grid md:grid-cols-2 gap-8 text-slate-300">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Company Details</h3>
                <div className="space-y-2">
                  <p><span className="text-white font-semibold">Company Name:</span> QuizGod</p>
                  <p><span className="text-white font-semibold">Website:</span> https://quizgod-swart.vercel.app</p>
                  <p><span className="text-white font-semibold">Security:</span> ✅ SSL/HTTPS Enabled</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Support & Legal</h3>
                <div className="space-y-2">
                  <p><span className="text-white font-semibold">Email:</span> quizgod25@gmail.com</p>
                  <p><span className="text-white font-semibold">Policies:</span></p>
                  <div className="ml-4 space-y-1">
                    <p>• <a href="/terms" className="text-purple-400 hover:text-purple-300">Terms of Service</a></p>
                    <p>• <a href="/privacy" className="text-purple-400 hover:text-purple-300">Privacy Policy</a></p>
                    <p>• <a href="/refund" className="text-purple-400 hover:text-purple-300">Refund Policy</a></p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Footer */}
          <footer className="pt-12 pb-8 border-t border-white/20">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              {/* Company Info */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4">QuizGod</h3>
                <p className="text-slate-400 text-sm mb-4">
                  AI-powered quiz platform for students and educators. Create, share, and master knowledge.
                </p>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span className="text-green-400">✓</span>
                  <span>SSL/HTTPS Secured</span>
                </div>
              </div>

              {/* Product */}
              <div>
                <h4 className="text-white font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><a href="/features" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="/premium" className="hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="/ai-quiz" className="hover:text-white transition-colors">AI Quiz Generator</a></li>
                  <li><a href="/create" className="hover:text-white transition-colors">Create Quiz</a></li>
                  <li><a href="/quizzes" className="hover:text-white transition-colors">Browse Quizzes</a></li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="text-white font-semibold mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
                  <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="/refund" className="hover:text-white transition-colors">Refund Policy</a></li>
                  <li><a href="/terms" className="hover:text-white transition-colors">Cookie Policy</a></li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h4 className="text-white font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>
                    <a href="mailto:quizgod25@gmail.com" className="hover:text-white transition-colors flex items-center gap-2">
                      <span>📧</span>
                      <span>quizgod25@gmail.com</span>
                    </a>
                  </li>
                  <li className="pt-2">
                    <div className="text-xs text-slate-500">Business Hours</div>
                    <div className="text-sm">Mon-Fri: 9AM-6PM EST</div>
                  </li>
                  <li className="pt-2">
                    <div className="text-xs text-slate-500">Response Time</div>
                    <div className="text-sm">Usually within 24 hours</div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="border-t border-white/10 pt-6 mb-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center md:text-left">
                  <p className="text-xs text-slate-500 mb-2">Secure Payments Powered By</p>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold text-lg">Paddle</span>
                    <span className="text-slate-400 text-xs">| Merchant of Record</span>
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-xs text-slate-500 mb-2">Accepted Payment Methods</p>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span>💳 Credit Cards</span>
                    <span>•</span>
                    <span>🏦 Debit Cards</span>
                    <span>•</span>
                    <span>💰 PayPal</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/10 pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <span>© 2025 QuizGod.</span>
                  <span>All rights reserved.</span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <a href="/terms" className="hover:text-white transition-colors">Terms</a>
                  <span>•</span>
                  <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
                  <span>•</span>
                  <a href="/refund" className="hover:text-white transition-colors">Refunds</a>
                  <span>•</span>
                  <span>Made with ❤️ for learners worldwide</span>
                </div>
              </div>
            </div>
          </footer>
          </div>
        </div>
        
        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <SideNav />
      
      <div className="md:ml-64 min-h-screen p-4 md:p-8 pb-32 md:pb-8">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-500/5 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-violet-500/5 rounded-full filter blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
        </div>

        <div className="relative z-10 mb-6 md:mb-8">
          <div className="glass-card rounded-3xl p-6 md:p-12 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border-2 border-white/10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl md:text-6xl font-black mb-3">
                  <span className="text-white">Welcome back,</span>
                  <br/>
                  <span className="gradient-text">{userProfile?.name || userProfile?.username || user.email?.split('@')[0]}</span>
                </h1>
                <p className="text-slate-300 text-base md:text-lg">Ready to master something new today?</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-0">
          <div className="glass-card rounded-3xl p-4 md:p-6 animate-slide-up">
            <div className="text-xs md:text-sm text-slate-400 mb-2">Total Quizzes</div>
            <div className="text-3xl md:text-4xl font-black gradient-text mb-2">{stats.totalQuizzes}</div>
            <div className="text-xs text-emerald-400">✓ Keep going!</div>
          </div>

          <div className="glass-card rounded-3xl p-4 md:p-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
            <div className="text-xs md:text-sm text-slate-400 mb-2">Avg Score</div>
            <div className="text-3xl md:text-4xl font-black gradient-text mb-2">{stats.avgScore}%</div>
            <div className="text-xs text-cyan-400">↗ Improving</div>
          </div>

          <div className="glass-card rounded-3xl p-4 md:p-6 animate-slide-up" style={{animationDelay: '0.2s'}}>
            <div className="text-xs md:text-sm text-slate-400 mb-2">Current Streak</div>
            <div className="text-3xl md:text-4xl font-black gradient-text mb-2">{stats.streak}</div>
            <div className="text-xs text-orange-400">🔥 On fire!</div>
          </div>

          <div className="glass-card rounded-3xl p-4 md:p-6 sm:col-span-2 lg:col-span-3 xl:col-span-1 xl:row-span-2 animate-slide-up" style={{animationDelay: '0.3s'}}>
            <h3 className="text-lg md:text-xl font-bold text-white mb-4">Recent Activity</h3>
            {loadingRecords ? (
              <div className="text-slate-400">Loading...</div>
            ) : recentActivityWithDetails.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentActivityWithDetails.map((record) => (
                  <div key={record.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-white text-sm md:text-base truncate">{record.quizTitle}</div>
                      <div className="text-xs md:text-sm text-slate-400">{new Date(record.timestamp?.toDate?.() || Date.now()).toLocaleDateString()}</div>
                    </div>
                    <div className="text-xl md:text-2xl font-black gradient-text whitespace-nowrap">{record.score}/{record.maxScore}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 md:py-8 text-slate-400">
                <div className="text-3xl md:text-4xl mb-2">📊</div>
                <div className="text-sm md:text-base">No quizzes taken yet. Start learning!</div>
              </div>
            )}
          </div>

          <div className="glass-card rounded-3xl p-4 md:p-6 sm:col-span-2 lg:col-span-3 animate-slide-up" style={{animationDelay: '0.4s'}}>
            <h3 className="text-lg md:text-xl font-bold text-white mb-4">Explore Subjects</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
              {userSubjects.length > 0 ? (
                userSubjects.map((subject, index) => {
                  const gradients = [
                    'from-blue-400 to-indigo-500',
                    'from-green-400 to-emerald-500',
                    'from-amber-400 to-orange-500',
                    'from-purple-400 to-violet-500'
                  ];
                  const gradient = gradients[index % gradients.length];
                  
                  return (
                    <Link key={subject.id} href={`/subjects`} className="glass-card rounded-xl p-3 md:p-4 hover:scale-105 transition-all duration-300 group text-center">
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg md:text-xl mx-auto mb-2 group-hover:rotate-12 transition-transform`}>
                        {subject.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-xs md:text-sm font-semibold text-slate-200 group-hover:text-white transition-colors truncate">{subject.name}</div>
                    </Link>
                  );
                })
              ) : (
                <>
                  <Link href="/subjects" className="glass-card rounded-xl p-3 md:p-4 hover:scale-105 transition-all duration-300 group text-center">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg md:text-xl mx-auto mb-2 group-hover:rotate-12 transition-transform">M</div>
                    <div className="text-xs md:text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">Mathematics</div>
                  </Link>
                  <Link href="/subjects" className="glass-card rounded-xl p-3 md:p-4 hover:scale-105 transition-all duration-300 group text-center">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg md:text-xl mx-auto mb-2 group-hover:rotate-12 transition-transform">S</div>
                    <div className="text-xs md:text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">Science</div>
                  </Link>
                  <Link href="/subjects" className="glass-card rounded-xl p-3 md:p-4 hover:scale-105 transition-all duration-300 group text-center">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg md:text-xl mx-auto mb-2 group-hover:rotate-12 transition-transform">H</div>
                    <div className="text-xs md:text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">History</div>
                  </Link>
                  <Link href="/subjects" className="glass-card rounded-xl p-3 md:p-4 hover:scale-105 transition-all duration-300 group text-center">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center text-white font-bold text-lg md:text-xl mx-auto mb-2 group-hover:rotate-12 transition-transform">L</div>
                    <div className="text-xs md:text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">Languages</div>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Center Ad - Only for non-premium users */}
      {!userProfile?.isPremium && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <AdsterraAd 
            atOptions={{
              key: 'e478b629ee3a3e02c8e9579be23fe46d',
              format: 'iframe',
              height: 90,
              width: 728,
              params: {}
            }}
          />
        </div>
      )}

      {/* Footer with Required Information */}
      <footer className="mt-16 border-t border-white/10 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* About */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">QuizGod</h3>
              <p className="text-slate-400 text-sm mb-4">
                AI-powered quiz platform for students and educators. Create, share, and take interactive quizzes with advanced features.
              </p>
              <p className="text-slate-500 text-xs">
                © 2025 QuizGod. All rights reserved.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/premium" className="text-slate-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/premium" className="text-slate-400 hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/quiz-creator" className="text-slate-400 hover:text-white transition-colors">Quiz Creator</Link></li>
                <li><Link href="/subjects" className="text-slate-400 hover:text-white transition-colors">Subjects</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms" className="text-slate-400 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/terms" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-slate-400 hover:text-white transition-colors">Refund Policy</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:quizgod25@gmail.com" className="text-slate-400 hover:text-white transition-colors">quizgod25@gmail.com</a></li>
                <li className="text-slate-400">Free: Basic features</li>
                <li className="text-slate-400">Premium: $5/month</li>
              </ul>
            </div>
          </div>

          {/* Key Features */}
          <div className="border-t border-white/10 pt-6">
            <h4 className="text-white font-semibold mb-3 text-sm">Key Features</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-400">
              <div>✓ AI Quiz Generation</div>
              <div>✓ Custom Quiz Creator</div>
              <div>✓ Live Multiplayer</div>
              <div>✓ Progress Tracking</div>
              <div>✓ Multiple Question Types</div>
              <div>✓ Timer & Difficulty Settings</div>
              <div>✓ Class Management</div>
              <div>✓ Analytics Dashboard</div>
            </div>
          </div>
        </div>
      </footer>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
