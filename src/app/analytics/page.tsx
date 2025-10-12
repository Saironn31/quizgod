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
  const { user } = useAuth();
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

  useEffect(() => {
    async function fetchStats() {
      if (!user?.uid) return;
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
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="glass-card rounded-3xl p-6 md:col-span-2 animate-slide-up">
            <h3 className="text-xl font-bold text-white mb-4">Quiz Analytics</h3>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="glass-card rounded-xl p-4">
                <div className="text-sm text-slate-400 mb-1">Total Quizzes</div>
                <div className="text-3xl font-black gradient-text">{stats.quizzesTaken}</div>
              </div>
              <div className="glass-card rounded-xl p-4">
                <div className="text-sm text-slate-400 mb-1">Avg Score</div>
                <div className="text-3xl font-black gradient-text">{stats.avgScore}%</div>
              </div>
              <div className="glass-card rounded-xl p-4">
                <div className="text-sm text-slate-400 mb-1">Best Score</div>
                <div className="text-3xl font-black text-emerald-400">{stats.bestScore}%</div>
              </div>
              <div className="glass-card rounded-xl p-4">
                <div className="text-sm text-slate-400 mb-1">Total Points</div>
                <div className="text-3xl font-black text-cyan-400">{stats.totalScore}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mt-8">
              <div className="bg-white/10 rounded-xl shadow-lg p-6 flex flex-col items-center">
                <h2 className="text-xl font-semibold mb-4 text-purple-200">Score History</h2>
                <div className="w-full h-56 sm:h-96">
                  <Bar data={barData} options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { color: '#fff' } }, x: { ticks: { color: '#fff' } } },
                  }} />
                </div>
              </div>
              <div className="bg-white/10 rounded-xl shadow-lg p-6 flex flex-col items-center">
                <h2 className="text-xl font-semibold mb-4 text-purple-200">Top Subjects</h2>
                <div className="w-full h-56 sm:h-96 max-w-sm">
                  <Doughnut data={doughnutData} options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: '#fff' } } },
                  }} />
                </div>
              </div>
            </div>
            
            {/* Subject Breakdown */}
            <div className="mt-8 bg-white/10 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Subject Performance</h2>
              <div className="space-y-3">
                {stats.topSubjects.map((subject, index) => (
                  <div key={subject.subject} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{subject.subject}</div>
                        <div className="text-sm text-slate-400">{subject.quizCount} quizzes taken</div>
                      </div>
                    </div>
                    <div className="text-2xl font-black gradient-text">{subject.score}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="glass-card rounded-3xl p-6 md:col-span-1 animate-slide-up" style={{animationDelay: '0.1s'}}>
            <h3 className="text-xl font-bold text-white mb-4">Recent Quizzes</h3>
            <div className="space-y-3">
              {stats.recentQuizzes.length > 0 ? (
                stats.recentQuizzes.map((quiz) => (
                  <div key={quiz.id} className="glass-card rounded-xl p-4">
                    <div className="font-semibold text-white mb-1">{quiz.quizTitle}</div>
                    {quiz.subject && (
                      <div className="text-xs text-slate-400 mb-2">{quiz.subject}</div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-300">
                        {quiz.score}/{quiz.maxScore}
                      </div>
                      <div className="text-lg font-black gradient-text">{quiz.percentage}%</div>
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      {quiz.timestamp?.toDate?.() ? new Date(quiz.timestamp.toDate()).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <div className="text-4xl mb-2">📊</div>
                  <div>No quizzes yet</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
