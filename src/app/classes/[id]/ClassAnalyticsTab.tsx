import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { getClassQuizRecords } from '@/lib/firestore';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const Bar = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), { ssr: false });
const Doughnut = dynamic(() => import('react-chartjs-2').then(mod => mod.Doughnut), { ssr: false });

interface TopSubject {
  subject: string;
  score: number;
}

interface ClassAnalyticsStats {
  quizzesTaken: number;
  avgScore: number;
  topSubjects: TopSubject[];
  scoreHistory: number[];
  memberCount: number;
}

interface ClassAnalyticsTabProps {
  classData: any;
  user: any;
  quizzes: any[];
  subjects: any[];
}

export default function ClassAnalyticsTab({ classData, user, quizzes, subjects }: ClassAnalyticsTabProps) {
  const [stats, setStats] = useState<ClassAnalyticsStats>({ 
    quizzesTaken: 0, 
    avgScore: 0, 
    topSubjects: [], 
    scoreHistory: [],
    memberCount: 0
  });

  useEffect(() => {
    async function fetchStats() {
      if (!classData?.id) return;
      const records = await getClassQuizRecords(classData.id);
      const quizzesTaken = records.length;
      const memberCount = classData?.members?.length || 0;
      
      // Calculate average score
      let totalPercent = 0;
      for (const r of records) {
        let percent = 0;
        if (r.quizId) {
          const quiz = quizzes.find((q: any) => q.id === r.quizId);
          const maxScore = quiz?.questions?.length || 1;
          percent = maxScore > 0 ? (r.score / maxScore) * 100 : 0;
        }
        totalPercent += percent;
      }
      const avgScore = quizzesTaken > 0 ? Math.round(totalPercent / quizzesTaken) : 0;
      
      // Calculate score history (last 7 records)
      const scoreHistory = records.slice(-7).map(r => {
        const quiz = quizzes.find((q: any) => q.id === r.quizId);
        const maxScore = quiz?.questions?.length || 1;
        return maxScore > 0 ? Math.round((r.score / maxScore) * 100) : 0;
      });

      // Aggregate top subjects
      const subjectScores: { [subject: string]: number[] } = {};
      records.forEach(r => {
        if (r.subject) {
          if (!subjectScores[r.subject]) subjectScores[r.subject] = [];
          const quiz = quizzes.find((q: any) => q.id === r.quizId);
          const maxScore = quiz?.questions?.length || 1;
          const percent = maxScore > 0 ? (r.score / maxScore) * 100 : 0;
          subjectScores[r.subject].push(percent);
        }
      });
      const topSubjects = Object.entries(subjectScores)
        .map(([subject, scores]) => ({ subject, score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      setStats({ quizzesTaken, avgScore, topSubjects, scoreHistory, memberCount });
    }
    fetchStats();
  }, [classData, quizzes]);

  const barData = {
    labels: stats.scoreHistory.map((_, i) => `Quiz ${i + 1}`),
    datasets: [
      {
        label: 'Score (%)',
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
    <div className="space-y-6">
      <div className="bg-white/10 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-6 text-purple-200 text-center">Class Analytics</h2>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-blue-300">{stats.memberCount}</span>
            <span className="text-purple-200">Members</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-yellow-300">{stats.quizzesTaken}</span>
            <span className="text-purple-200">Quizzes Taken</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-green-300">{stats.avgScore}%</span>
            <span className="text-purple-200">Average Score</span>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-purple-200 text-center">Recent Performance</h3>
            <Bar data={barData} options={{
              plugins: { legend: { display: false } },
              scales: { 
                y: { beginAtZero: true, ticks: { color: '#fff' } }, 
                x: { ticks: { color: '#fff' } } 
              },
            }} />
          </div>
          
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-purple-200 text-center">Top Subjects</h3>
            {stats.topSubjects.length > 0 ? (
              <Doughnut data={doughnutData} options={{
                plugins: { legend: { labels: { color: '#fff' } } },
              }} />
            ) : (
              <div className="flex items-center justify-center h-48 text-purple-200">
                No subject data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
