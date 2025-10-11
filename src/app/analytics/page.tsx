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
}

interface AnalyticsStats {
  quizzesTaken: number;
  avgScore: number;
  topSubjects: TopSubject[];
  scoreHistory: number[];
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AnalyticsStats>({ quizzesTaken: 0, avgScore: 0, topSubjects: [], scoreHistory: [] });

  useEffect(() => {
    async function fetchStats() {
      if (!user?.uid) return;
      const records = await getUserQuizRecords(user.uid);
      const quizzesTaken = records.length;
      // Normalize each score by quiz length (percentage)
      let totalPercent = 0;
      for (const r of records) {
        let percent = 0;
        if (r.quizId) {
          const quiz = await getQuizById(r.quizId);
          const maxScore = quiz?.questions?.length || 1;
          percent = maxScore > 0 ? (r.score / maxScore) * 100 : 0;
        }
        totalPercent += percent;
      }
      const avgScore = quizzesTaken > 0 ? Math.round(totalPercent / quizzesTaken) : 0;
      const scoreHistory = records.slice(-7).map(r => r.score);

      // Aggregate top subjects
      const subjectScores: { [subject: string]: number[] } = {};
      records.forEach(r => {
        if (r.subject) {
          if (!subjectScores[r.subject]) subjectScores[r.subject] = [];
          subjectScores[r.subject].push(r.score);
        }
      });
      const topSubjects = Object.entries(subjectScores)
        .map(([subject, scores]) => ({ subject, score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      setStats({ quizzesTaken, avgScore, topSubjects, scoreHistory });
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
      <div className="md:ml-64 min-h-screen p-4 md:p-8">
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
            <div className="mt-10 bg-white/10 rounded-xl shadow-lg p-6 w-full max-w-2xl flex flex-col items-center">
              <h2 className="text-xl font-semibold mb-4 text-purple-200">Summary</h2>
              <div className="flex flex-col md:flex-row gap-8 w-full justify-center items-center">
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-bold text-yellow-300">{stats.quizzesTaken}</span>
                  <span className="text-purple-200">Quizzes Taken</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-bold text-green-300">{stats.avgScore}%</span>
                  <span className="text-purple-200">Average Score</span>
                </div>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-3xl p-6 md:col-span-1 animate-slide-up" style={{animationDelay: '0.1s'}}>
            <h3 className="text-xl font-bold text-white mb-4">Quick Links</h3>
            <div className="space-y-3">
              <Link href="/quizzes" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">📝</div>
                <span className="font-semibold text-slate-200 group-hover:text-white transition-colors">My Quizzes</span>
              </Link>
              <Link href="/classes" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">🏫</div>
                <span className="font-semibold text-slate-200 group-hover:text-white transition-colors">My Classes</span>
              </Link>
              <Link href="/create" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">➕</div>
                <span className="font-semibold text-slate-200 group-hover:text-white transition-colors">Create Quiz</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
