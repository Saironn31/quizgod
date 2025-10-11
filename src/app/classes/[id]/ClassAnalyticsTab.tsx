import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { getClassQuizRecords, getUserProfile } from '@/lib/firestore';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const Bar = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), { ssr: false });

interface RecentQuiz {
  userName: string;
  quizTitle: string;
  score: number;
  maxScore: number;
  date: string;
  percentage: number;
}

interface ClassAnalyticsStats {
  quizzesTaken: number;
  avgScore: number;
  scoreHistory: number[];
  memberCount: number;
  recentQuizzes: RecentQuiz[];
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
    scoreHistory: [],
    memberCount: 0,
    recentQuizzes: []
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

      // Get recent quiz records (last 5)
      const recentQuizzes: RecentQuiz[] = await Promise.all(
        records
          .slice(-5)
          .reverse()
          .map(async (r) => {
            const quiz = quizzes.find((q: any) => q.id === r.quizId);
            const maxScore = quiz?.questions?.length || 1;
            const percentage = maxScore > 0 ? Math.round((r.score / maxScore) * 100) : 0;
            
            // Fetch user profile to get name/username
            const userProfile = await getUserProfile(r.userId);
            const userName = userProfile?.name || userProfile?.username || userProfile?.email || 'Unknown User';
            
            return {
              userName,
              quizTitle: quiz?.title || 'Unknown Quiz',
              score: r.score || 0,
              maxScore: maxScore,
              date: r.timestamp instanceof Date ? r.timestamp.toLocaleDateString() : 'N/A',
              percentage
            };
          })
      );

      setStats({ quizzesTaken, avgScore, scoreHistory, memberCount, recentQuizzes });
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
            {stats.scoreHistory.length > 0 ? (
              <Bar data={barData} options={{
                plugins: { legend: { display: false } },
                scales: { 
                  y: { beginAtZero: true, ticks: { color: '#fff' } }, 
                  x: { ticks: { color: '#fff' } } 
                },
              }} />
            ) : (
              <div className="flex items-center justify-center h-48 text-purple-200">
                No quiz data available
              </div>
            )}
          </div>
          
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-purple-200 text-center">Recent Class Quiz Taken</h3>
            {stats.recentQuizzes.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {stats.recentQuizzes.map((quiz, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="text-white font-semibold text-sm truncate">{quiz.quizTitle}</div>
                        <div className="text-purple-300 text-xs mt-1">👤 {quiz.userName}</div>
                      </div>
                      <div className="text-right ml-2">
                        <div className="text-green-300 font-bold text-sm">{quiz.percentage}%</div>
                        <div className="text-purple-200 text-xs">{quiz.score}/{quiz.maxScore}</div>
                      </div>
                    </div>
                    <div className="text-purple-400 text-xs">📅 {quiz.date}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-purple-200">
                No recent quiz data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
