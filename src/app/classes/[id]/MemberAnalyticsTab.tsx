import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { getClassMemberQuizRecords } from '@/lib/firestore';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const Bar = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), { ssr: false });

interface MemberAnalyticsStats {
  quizzesTaken: number;
  avgScore: number;
  scoreHistory: number[];
  subjectPerformance: { subject: string; score: number }[];
}

interface MemberAnalyticsTabProps {
  classId: string;
  memberId: string;
  quizzes: any[];
  subjects: any[];
  onBack: () => void;
}

export default function MemberAnalyticsTab({ classId, memberId, quizzes, subjects, onBack }: MemberAnalyticsTabProps) {
  const [stats, setStats] = useState<MemberAnalyticsStats>({ 
    quizzesTaken: 0, 
    avgScore: 0, 
    scoreHistory: [],
    subjectPerformance: []
  });

  useEffect(() => {
    async function fetchStats() {
      if (!classId || !memberId) return;
      const records = await getClassMemberQuizRecords(classId, memberId);
      const quizzesTaken = records.length;
      
      // Calculate scores and history
      let totalPercent = 0;
      const scoreHistory: number[] = [];
      const subjectScores: { [subject: string]: number[] } = {};
      
      for (const r of records) {
        let percent = 0;
        if (r.quizId) {
          const quiz = quizzes.find((q: any) => q.id === r.quizId);
          const maxScore = quiz?.questions?.length || 1;
          percent = maxScore > 0 ? Math.round((r.score / maxScore) * 100) : 0;
        }
        totalPercent += percent;
        scoreHistory.push(percent);
        
        // Track subject performance
        if (r.subject) {
          if (!subjectScores[r.subject]) subjectScores[r.subject] = [];
          subjectScores[r.subject].push(percent);
        }
      }
      
      const avgScore = quizzesTaken > 0 ? Math.round(totalPercent / quizzesTaken) : 0;
      
      // Calculate subject performance
      const subjectPerformance = Object.entries(subjectScores)
        .map(([subject, scores]) => ({ 
          subject, 
          score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
        }))
        .sort((a, b) => b.score - a.score);

      setStats({ quizzesTaken, avgScore, scoreHistory, subjectPerformance });
    }
    fetchStats();
  }, [classId, memberId, quizzes]);

  const barData = {
    labels: stats.scoreHistory.map((_, i) => `Quiz ${i + 1}`),
    datasets: [
      {
        label: 'Score (%)',
        data: stats.scoreHistory,
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/10 rounded-xl shadow-lg p-6">
        <div className="w-full flex justify-start mb-6">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            ← Back to Members
          </button>
        </div>
        
        <h2 className="text-xl font-semibold mb-6 text-purple-200 text-center">Member Analytics</h2>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-yellow-300">{stats.quizzesTaken}</span>
            <span className="text-purple-200">Quizzes Taken</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-green-300">{stats.avgScore}%</span>
            <span className="text-purple-200">Average Score</span>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-white/5 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-purple-200 text-center">Quiz Performance History</h3>
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

        {/* Subject Performance */}
        {stats.subjectPerformance.length > 0 && (
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-purple-200 text-center">Subject Performance</h3>
            <div className="space-y-3">
              {stats.subjectPerformance.map((subject, index) => (
                <div key={subject.subject} className="flex justify-between items-center">
                  <span className="text-purple-200">{subject.subject}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-green-400 h-2 rounded-full" 
                        style={{ width: `${subject.score}%` }}
                      ></div>
                    </div>
                    <span className="text-green-300 font-semibold w-12 text-right">{subject.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
