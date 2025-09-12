"use client";
import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Class {
  id: string;
  name: string;
  description: string;
  code: string;
  createdBy: string;
  createdAt: string;
  members: string[];
}

interface Quiz {
  title: string;
  subject: string;
  description?: string;
  questions: { question: string; options: string[]; correct: number }[];
  createdBy?: string;
  createdAt?: string;
}

interface QuizScore {
  username: string;
  score: number;
  percentage: number;
  completionTime: number;
  completedAt: string;
  quizKey: string;
  quizTitle: string;
}

interface LeaderboardEntry {
  username: string;
  totalScore: number;
  averageScore: number;
  quizzesCompleted: number;
  totalTime: number;
  averageTime: number;
  lastActive: string;
  bestQuiz?: {
    title: string;
    score: number;
    time: number;
  };
}

export default function LeaderboardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const specificQuiz = searchParams.get('quiz');
  
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [classData, setClassData] = useState<Class | null>(null);
  const [allScores, setAllScores] = useState<QuizScore[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [quizzes, setQuizzes] = useState<{ key: string; quiz: Quiz }[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<string>(specificQuiz || 'all');
  const [sortBy, setSortBy] = useState<'score' | 'time' | 'quizzes'>('score');

  useEffect(() => {
    const user = localStorage.getItem("qg_user");
    if (!user) {
      window.location.href = "/";
      return;
    }
    setCurrentUser(user);
    loadClassData(params.id as string);
  }, [params.id]);

  useEffect(() => {
    if (specificQuiz) {
      setSelectedQuiz(specificQuiz);
    }
  }, [specificQuiz]);

  useEffect(() => {
    if (classData) {
      loadLeaderboardData();
    }
  }, [classData, selectedQuiz, sortBy]);

  const loadClassData = (classId: string) => {
    const classInfo = localStorage.getItem(`qg_class_${classId}`);
    if (!classInfo) {
      alert("Class not found!");
      window.location.href = "/classes";
      return;
    }

    const parsedClass = JSON.parse(classInfo);
    setClassData(parsedClass);
    loadClassQuizzes(classId);
  };

  const loadClassQuizzes = (classId: string) => {
    const classQuizzes = localStorage.getItem(`qg_class_quizzes_${classId}`);
    if (classQuizzes) {
      const quizKeys = JSON.parse(classQuizzes);
      const loadedQuizzes = quizKeys.map((key: string) => {
        const quizData = localStorage.getItem(key);
        return quizData ? { key, quiz: JSON.parse(quizData) } : null;
      }).filter(Boolean);
      setQuizzes(loadedQuizzes);
    }
  };

  const loadLeaderboardData = () => {
    if (!classData) return;

    // Collect all scores from class members
    const allMemberScores: QuizScore[] = [];
    
    classData.members.forEach(member => {
      const memberScores = localStorage.getItem(`qg_quiz_scores_${member}`);
      if (memberScores) {
        const scores = JSON.parse(memberScores);
        scores.forEach((score: QuizScore) => {
          // Only include scores from class quizzes
          const classQuizKeys = quizzes.map(q => q.key);
          if (classQuizKeys.includes(score.quizKey)) {
            allMemberScores.push({
              ...score,
              username: member
            });
          }
        });
      }
    });

    setAllScores(allMemberScores);
    generateLeaderboard(allMemberScores);
  };

  const generateLeaderboard = (scores: QuizScore[]) => {
    const memberStats: { [username: string]: LeaderboardEntry } = {};

    // Initialize all members
    classData?.members.forEach(member => {
      memberStats[member] = {
        username: member,
        totalScore: 0,
        averageScore: 0,
        quizzesCompleted: 0,
        totalTime: 0,
        averageTime: 0,
        lastActive: 'Never'
      };
    });

    // Calculate stats
    scores.forEach(score => {
      if (selectedQuiz === 'all' || score.quizKey === selectedQuiz) {
        const member = memberStats[score.username];
        if (member) {
          member.totalScore += score.score;
          member.quizzesCompleted += 1;
          member.totalTime += score.completionTime;
          member.lastActive = score.completedAt;

          // Track best quiz performance
          if (!member.bestQuiz || score.score > member.bestQuiz.score) {
            member.bestQuiz = {
              title: score.quizTitle,
              score: score.score,
              time: score.completionTime
            };
          }
        }
      }
    });

    // Calculate averages
    Object.values(memberStats).forEach(member => {
      if (member.quizzesCompleted > 0) {
        member.averageScore = Math.round(member.totalScore / member.quizzesCompleted);
        member.averageTime = Math.round(member.totalTime / member.quizzesCompleted);
      }
    });

    // Sort leaderboard
    const sortedLeaderboard = Object.values(memberStats).sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.averageScore - a.averageScore || b.totalScore - a.totalScore;
        case 'time':
          return (a.averageTime || Infinity) - (b.averageTime || Infinity);
        case 'quizzes':
          return b.quizzesCompleted - a.quizzesCompleted;
        default:
          return b.averageScore - a.averageScore;
      }
    });

    setLeaderboard(sortedLeaderboard);
  };

  const getQuizSpecificScores = () => {
    if (selectedQuiz === 'all') return [];
    
    return allScores
      .filter(score => score.quizKey === selectedQuiz)
      .sort((a, b) => b.score - a.score || a.completionTime - b.completionTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${position}`;
    }
  };

  if (!currentUser || !classData) {
    return <div>Loading...</div>;
  }

  const quizSpecificScores = getQuizSpecificScores();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            🧠 QuizGod
          </Link>
          <div className="flex items-center space-x-4">
            <Link href={`/classes/${classData.id}`} className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              ← Back to Class
            </Link>
            <span className="text-gray-700 dark:text-gray-200">Welcome, {currentUser}!</span>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-8">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-3xl font-bold">🏆 {classData.name} Leaderboard</h1>
          <p className="text-yellow-100 mt-2">Track performance and compete with classmates!</p>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 border dark:border-gray-700">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quiz Filter
                </label>
                <select
                  value={selectedQuiz}
                  onChange={(e) => setSelectedQuiz(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dropdown-menu"
                >
                  <option value="all">All Quizzes</option>
                  {quizzes.map(({ key, quiz }) => (
                    <option key={key} value={key}>
                      {quiz.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dropdown-menu"
                >
                  <option value="score">Average Score</option>
                  <option value="time">Average Time</option>
                  <option value="quizzes">Quizzes Completed</option>
                </select>
              </div>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {selectedQuiz === 'all' ? 'overall' : 'quiz-specific'} rankings
            </div>
          </div>
        </div>

        {selectedQuiz !== 'all' && quizSpecificScores.length > 0 ? (
          /* Quiz-specific scores */
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                📝 {quizzes.find(q => q.key === selectedQuiz)?.quiz.title} Results
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {quizSpecificScores.map((score, index) => (
                    <tr key={`${score.username}-${score.completedAt}`} className={score.username === currentUser ? 'bg-blue-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg">{getRankIcon(index + 1)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
                            {score.username[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {score.username}
                              {score.username === currentUser && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">You</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-semibold">{score.score}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          score.percentage >= 80 ? 'bg-green-100 text-green-800' :
                          score.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {score.percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(score.completionTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(score.completedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Overall leaderboard */
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                🏆 Overall Class Rankings
              </h2>
            </div>
            
            {leaderboard.filter(entry => entry.quizzesCompleted > 0).length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Quiz Results Yet</h3>
                <p className="text-gray-500 mb-4">Complete some quizzes to see the leaderboard!</p>
                <Link
                  href={`/classes/${classData.id}`}
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Back to Class
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quizzes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Best Quiz</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaderboard
                      .filter(entry => entry.quizzesCompleted > 0)
                      .map((entry, index) => (
                      <tr key={entry.username} className={entry.username === currentUser ? 'bg-blue-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg">{getRankIcon(index + 1)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
                              {entry.username[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {entry.username}
                                {entry.username === currentUser && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">You</span>
                                )}
                                {entry.username === classData.createdBy && (
                                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">👑 President</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-semibold">{entry.averageScore}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.totalScore}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {entry.quizzesCompleted}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.averageTime > 0 ? formatTime(entry.averageTime) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.bestQuiz ? (
                            <div className="text-xs">
                              <div className="font-medium">{entry.bestQuiz.title}</div>
                              <div className="text-gray-500">
                                {entry.bestQuiz.score} pts in {formatTime(entry.bestQuiz.time)}
                              </div>
                            </div>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {leaderboard.filter(e => e.quizzesCompleted > 0).length}
            </div>
            <div className="text-sm text-gray-600">Active Players</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {allScores.length}
            </div>
            <div className="text-sm text-gray-600">Total Attempts</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {quizzes.length}
            </div>
            <div className="text-sm text-gray-600">Available Quizzes</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {allScores.length > 0 ? Math.round(allScores.reduce((sum, score) => sum + score.percentage, 0) / allScores.length) : 0}%
            </div>
            <div className="text-sm text-gray-600">Class Average</div>
          </div>
        </div>
      </div>
    </div>
  );
}
