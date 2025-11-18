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
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full filter blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-500/10 rounded-full filter blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="relative z-10 text-center px-4 animate-fade-in">
          <div className="mb-8 inline-block">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-400 via-violet-500 to-pink-500 flex items-center justify-center text-white text-5xl font-black animate-bounce-soft shadow-glow">
              Q
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black mb-6">
            <span className="gradient-text">QuizGod</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-2xl mx-auto">
            The most advanced quiz platform for modern learners
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowAuth(true)}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold text-lg hover:scale-105 transition-all duration-300 shadow-glow"
            >
              Start Learning
            </button>
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

      {/* Fixed Bottom Center Ad */}
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

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
