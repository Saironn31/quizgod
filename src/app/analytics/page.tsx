"use client";
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { useAuth } from '@/contexts/AuthContext';
import { getUserQuizRecords } from '@/lib/firestore';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const Bar = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), { ssr: false });
const Doughnut = dynamic(() => import('react-chartjs-2').then(mod => mod.Doughnut), { ssr: false });

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ quizzesTaken: 0, avgScore: 0, topSubjects: [], scoreHistory: [] });

  useEffect(() => {
    async function fetchStats() {
      if (!user?.uid) return;
      const records = await getUserQuizRecords(user.uid);
      const quizzesTaken = records.length;
      const avgScore = quizzesTaken > 0 ? Math.round(records.reduce((sum, r) => sum + (r.score || 0), 0) / quizzesTaken) : 0;
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 text-white flex flex-col items-center py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">📊 Analytics Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <div className="bg-white/10 rounded-xl shadow-lg p-6 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4 text-purple-200">Score History</h2>
          <Bar data={barData} options={{
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { color: '#fff' } }, x: { ticks: { color: '#fff' } } },
          }} />
        </div>
        <div className="bg-white/10 rounded-xl shadow-lg p-6 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4 text-purple-200">Top Subjects</h2>
          <Doughnut data={doughnutData} options={{
            plugins: { legend: { labels: { color: '#fff' } } },
          }} />
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
  );
}
