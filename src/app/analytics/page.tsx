"use client";
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { useAuth } from '@/contexts/AuthContext';
import { getUserQuizRecords, getQuizById } from '@/lib/firestore';
import SideNav from '@/components/SideNav';
import Link from "next/link";

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const Bar = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), { ssr: false });
const Doughnut = dynamic(() => import('react-chartjs-2').then(mod => mod.Doughnut), { ssr: false });

interface TopSubject {
  subject: string;
  score: number;
  quizCount: number;
}

interface RecentQuiz {
  id: string;
  quizTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  timestamp: any;
  subject?: string;
}

interface AnalyticsStats {
  quizzesTaken: number;
  avgScore: number;
  topSubjects: TopSubject[];
  scoreHistory: number[];
  recentQuizzes: RecentQuiz[];
  bestScore: number;
  worstScore: number;
  totalScore: number;
}

export default function AnalyticsPage() {
  const { user, userProfile } = useAuth();
  const [stats, setStats] = useState<AnalyticsStats>({ 
    quizzesTaken: 0, 
    avgScore: 0, 
    topSubjects: [], 
    scoreHistory: [], 
    recentQuizzes: [],
    bestScore: 0,
    worstScore: 0,
    totalScore: 0
  });

  const isPremium = userProfile?.role === 'admin' || (userProfile?.isPremium && userProfile?.premiumStatus === 'active');

  useEffect(() => {
    async function fetchStats() {
      if (!user?.uid || !isPremium) return;
      const records = await getUserQuizRecords(user.uid);
      const quizzesTaken = records.length;
      
      // Normalize each score by quiz length (percentage)
      let totalPercent = 0;
      let totalScore = 0;
      let bestScore = 0;
      let worstScore = 100;
      const recentQuizzes: RecentQuiz[] = [];
      
      for (const r of records) {
        let percent = 0;
        let maxScore = 1;
        if (r.quizId) {
          const quiz = await getQuizById(r.quizId);
          maxScore = quiz?.questions?.length || 1;
          percent = maxScore > 0 ? (r.score / maxScore) * 100 : 0;
        }
        totalPercent += percent;
        totalScore += r.score;
        
        if (percent > bestScore) bestScore = percent;
        if (percent < worstScore) worstScore = percent;
        
        recentQuizzes.push({
          id: r.id || '',
          quizTitle: (r as any).quizTitle || 'Untitled Quiz',
          score: r.score,
          maxScore,
          percentage: Math.round(percent),
          timestamp: r.timestamp,
          subject: r.subject
        });
      }
      
      const avgScore = quizzesTaken > 0 ? Math.round(totalPercent / quizzesTaken) : 0;
      const scoreHistory = records.slice(-7).map(r => r.score);

      // Aggregate top subjects with quiz count
      const subjectScores: { [subject: string]: number[] } = {};
      records.forEach(r => {
        if (r.subject) {
          if (!subjectScores[r.subject]) subjectScores[r.subject] = [];
          subjectScores[r.subject].push(r.score);
        }
      });
      const topSubjects = Object.entries(subjectScores)
        .map(([subject, scores]) => ({ 
          subject, 
          score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
          quizCount: scores.length
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      setStats({ 
        quizzesTaken, 
        avgScore, 
        topSubjects, 
        scoreHistory, 
        recentQuizzes: recentQuizzes.slice(0, 5),
        bestScore: Math.round(bestScore),
        worstScore: quizzesTaken > 0 ? Math.round(worstScore) : 0,
        totalScore
      });
    }

    fetchStats();
  }, [user?.uid]);

  const barData = {
    labels: stats.scoreHistory.map((_, i) => `Quiz ${i + 1}`),
    datasets: [
      {
        label: 'Score',
        data: stats.scoreHistory,
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderRadius: 8,
      },
    ],
  };

  const doughnutData = {
    labels: stats.topSubjects.map(s => s.subject),
    datasets: [
      {
        label: 'Top Subjects',
        data: stats.topSubjects.map(s => s.score),
        backgroundColor: [
          'rgba(139, 92, 246, 0.7)',
          'rgba(34, 197, 94, 0.7)',
          'rgba(236, 72, 153, 0.7)',
        ],
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <SideNav />
      <div className="md:ml-64 min-h-screen p-4 md:p-8 pb-32 md:pb-8">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-500/5 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-violet-500/5 rounded-full filter blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
        </div>
        <div className="relative z-10 mb-8">
          <div className="glass-card rounded-3xl p-8 md:p-12 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-white/10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl md:text-6xl font-black mb-3">
                  <span className="text-white">Analytics</span>
                </h1>
                <p className="text-slate-300 text-lg">Track your quiz performance and progress</p>
              </div>
              <Link href="/quizzes" className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:scale-105 transition-all duration-300 shadow-glow">
                My Quizzes
              </Link>
            </div>
          </div>
        </div>

        {!isPremium ? (
          <div className="relative z-10 max-w-4xl mx-auto">
            <div className="glass-card rounded-3xl p-12 text-center bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-400/30">
              <div className="text-6xl mb-6">💎</div>
              <h2 className="text-3xl font-bold text-white mb-4">Premium Feature</h2>
              <p className="text-slate-300 text-lg mb-6">
                Unlock detailed analytics and performance tracking with Premium
              </p>
              <div className="space-y-3 text-left max-w-md mx-auto mb-8">
                <div className="flex items-center gap-3 text-slate-300">
                  <span className="text-green-400 text-xl">✓</span>
                  <span>Detailed performance dashboard</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <span className="text-green-400 text-xl">✓</span>
                  <span>Subject-wise analytics</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <span className="text-green-400 text-xl">✓</span>
                  <span>Score history and trends</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <span className="text-green-400 text-xl">✓</span>
                  <span>Recent quiz insights</span>
                </div>
              </div>
              <a 
                href="/premium" 
                className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-lg font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:scale-105"
              >
                Upgrade to Premium
              </a>
            </div>
          </div>
        ) : (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="glass-card rounded-3xl p-6 md:col-span-2 animate-slide-up">
            <h3 className="text-2xl font-bold text-white mb-6">📊 Performance Dashboard</h3>
            
            {/* Stats Cards - Bento Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
              <div className="glass-card rounded-xl p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-400/30 hover:scale-105 transition-all duration-300">
                <div className="text-xs md:text-sm text-blue-200 mb-1 font-medium">Total Quizzes</div>
                <div className="text-2xl md:text-3xl font-black text-blue-300">{stats.quizzesTaken}</div>
                <div className="text-xs text-blue-300/60 mt-1">Completed</div>
              </div>
              <div className="glass-card rounded-xl p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-400/30 hover:scale-105 transition-all duration-300">
                <div className="text-xs md:text-sm text-purple-200 mb-1 font-medium">Avg Score</div>
                <div className="text-2xl md:text-3xl font-black text-purple-300">{stats.avgScore}%</div>
                <div className="text-xs text-purple-300/60 mt-1">Overall</div>
              </div>
              <div className="glass-card rounded-xl p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-400/30 hover:scale-105 transition-all duration-300">
                <div className="text-xs md:text-sm text-emerald-200 mb-1 font-medium">Best Score</div>
                <div className="text-2xl md:text-3xl font-black text-emerald-300">{stats.bestScore}%</div>
                <div className="text-xs text-emerald-300/60 mt-1">Personal Best</div>
              </div>
              <div className="glass-card rounded-xl p-4 bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border border-cyan-400/30 hover:scale-105 transition-all duration-300">
                <div className="text-xs md:text-sm text-cyan-200 mb-1 font-medium">Total Points</div>
                <div className="text-2xl md:text-3xl font-black text-cyan-300">{stats.totalScore}</div>
                <div className="text-xs text-cyan-300/60 mt-1">Earned</div>
              </div>
            </div>
            
            {/* Charts - Improved Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-8">
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 rounded-2xl shadow-xl p-6 border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xl">
                    📈
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-white">Score History</h2>
                </div>
                <div className="w-full h-56 sm:h-72">
                  {stats.scoreHistory.length > 0 ? (
                    <Bar data={barData} options={{
                      maintainAspectRatio: false,
                      plugins: { 
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          titleColor: '#fff',
                          bodyColor: '#fff',
                          padding: 12,
                          cornerRadius: 8
                        }
                      },
                      scales: { 
                        y: { 
                          beginAtZero: true, 
                          ticks: { color: '#94a3b8' },
                          grid: { color: 'rgba(255, 255, 255, 0.05)' }
                        }, 
                        x: { 
                          ticks: { color: '#94a3b8' },
                          grid: { display: false }
                        } 
                      },
                    }} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <div className="text-center">
                        <div className="text-4xl mb-2">📊</div>
                        <p>No quiz history yet</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 rounded-2xl shadow-xl p-6 border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl">
                    🎯
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-white">Top Subjects</h2>
                </div>
                <div className="w-full h-56 sm:h-72 flex items-center justify-center">
                  {stats.topSubjects.length > 0 ? (
                    <div className="w-full max-w-[280px]">
                      <Doughnut data={doughnutData} options={{
                        maintainAspectRatio: false,
                        plugins: { 
                          legend: { 
                            labels: { 
                              color: '#fff',
                              padding: 15,
                              font: { size: 12 }
                            },
                            position: 'bottom'
                          },
                          tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            padding: 12,
                            cornerRadius: 8
                          }
                        },
                      }} />
                    </div>
                  ) : (
                    <div className="text-center text-slate-400">
                      <div className="text-4xl mb-2">📚</div>
                      <p>No subjects yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Subject Breakdown - Enhanced */}
            <div className="mt-8 bg-gradient-to-br from-slate-800/50 to-slate-700/50 rounded-2xl shadow-xl p-6 border border-slate-600/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-xl">
                  🏆
                </div>
                <h2 className="text-lg md:text-xl font-bold text-white">Subject Performance</h2>
              </div>
              {stats.topSubjects.length > 0 ? (
                <div className="space-y-3">
                  {stats.topSubjects.map((subject, index) => (
                    <div key={subject.subject} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 border border-white/5 hover:border-white/10">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                          index === 0 ? 'from-yellow-400 to-orange-500' :
                          index === 1 ? 'from-gray-300 to-gray-500' :
                          'from-orange-600 to-red-700'
                        }`}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-base md:text-lg">{subject.subject}</div>
                          <div className="text-xs md:text-sm text-slate-400">{subject.quizCount} {subject.quizCount === 1 ? 'quiz' : 'quizzes'} taken</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            {subject.score}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <div className="text-4xl mb-3">📖</div>
                  <p>Complete quizzes to see your subject performance</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="glass-card rounded-3xl p-6 md:col-span-1 animate-slide-up" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-xl">
                ⏱️
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white">Recent Quizzes</h3>
            </div>
            <div className="space-y-3">
              {stats.recentQuizzes.length > 0 ? (
                stats.recentQuizzes.map((quiz) => (
                  <div key={quiz.id} className="glass-card rounded-xl p-4 bg-gradient-to-br from-slate-800/50 to-slate-700/50 border border-slate-600/30 hover:border-slate-500/50 hover:scale-[1.02] transition-all duration-200">
                    <div className="font-semibold text-white mb-2 line-clamp-2">{quiz.quizTitle}</div>
                    {quiz.subject && (
                      <div className="inline-block px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-400/30 text-xs text-purple-200 mb-2">
                        {quiz.subject}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-sm text-slate-300">
                        {quiz.score}/{quiz.maxScore} correct
                      </div>
                      <div className={`text-xl font-black ${
                        quiz.percentage >= 80 ? 'text-emerald-400' :
                        quiz.percentage >= 60 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>{quiz.percentage}%</div>
                    </div>
                    <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                      <span>📅</span>
                      {quiz.timestamp?.toDate?.() ? new Date(quiz.timestamp.toDate()).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-5xl mb-3">🎯</div>
                  <div className="font-medium mb-1">No quizzes yet</div>
                  <p className="text-xs text-slate-500">Start taking quizzes to track your progress</p>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
