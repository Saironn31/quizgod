import React, { useEffect, useState } from 'react';
import { getClassMemberQuizRecords } from '@/lib/firestore';

interface MemberAnalyticsTabProps {
  classId: string;
  memberId: string;
  quizzes: any[];
  subjects: any[];
}

export default function MemberAnalyticsTab({ classId, memberId, quizzes, subjects }: MemberAnalyticsTabProps) {
  const [stats, setStats] = useState({ quizzesTaken: 0, avgScore: 0 });

  useEffect(() => {
    async function fetchStats() {
      if (!classId || !memberId) return;
      const records = await getClassMemberQuizRecords(classId, memberId);
      const quizzesTaken = records.length;
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
      setStats({ quizzesTaken, avgScore });
    }
    fetchStats();
  }, [classId, memberId, quizzes]);

  return (
    <div className="bg-white/10 rounded-xl shadow-lg p-6 flex flex-col items-center">
      <h2 className="text-xl font-semibold mb-4 text-purple-200">Member Analytics</h2>
      <div className="flex flex-col gap-4">
        <div>
          <span className="font-bold text-yellow-300">Quizzes Taken:</span> {stats.quizzesTaken}
        </div>
        <div>
          <span className="font-bold text-green-300">Average Score:</span> {stats.avgScore}%
        </div>
      </div>
    </div>
  );
}
