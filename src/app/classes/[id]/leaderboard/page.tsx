"use client";
import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams, useSearchParams } from "next/navigation";
import SideNav from '@/components/SideNav';
import Link from "next/link";
import { getQuizById } from "@/lib/firestore";

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
  mistakes?: any[];
}

interface LeaderboardEntry {
  username: string;
  displayName?: string;
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
  
  const { user } = useAuth();
  const [classData, setClassData] = useState<Class | null>(null);
  const [allScores, setAllScores] = useState<QuizScore[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [quizzes, setQuizzes] = useState<{ key: string; quiz: Quiz }[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<string>(specificQuiz || 'all');
  const [sortBy, setSortBy] = useState<'score' | 'time' | 'quizzes'>('score');

  // Load saved leaderboard sort preference
  useEffect(() => {
    try {
      const { loadPreference } = require('@/utils/preferences');
      const saved = loadPreference('leaderboard_sortBy');
      if (saved === 'score' || saved === 'time' || saved === 'quizzes') setSortBy(saved);
    } catch (e) {
      // ignore
    }
  }, []);

  // Save leaderboard sort preference
  useEffect(() => {
    try {
      const { savePreference } = require('@/utils/preferences');
      savePreference('leaderboard_sortBy', sortBy);
    } catch (e) {
      // ignore
    }
  }, [sortBy]);
  const [userProfiles, setUserProfiles] = useState<{ [uid: string]: { username: string; name: string } }>({});
  const [selectedRecord, setSelectedRecord] = useState<QuizScore | null>(null);

  useEffect(() => {
    loadClassData(params.id as string);
  }, [params.id]);

  useEffect(() => {
    if (specificQuiz) {
      setSelectedQuiz(specificQuiz);
    }
  }, [specificQuiz]);

  useEffect(() => {
    if (classData) {
      loadUserProfiles();
      loadLeaderboardData();
    }
  }, [classData, selectedQuiz, sortBy]);

  const loadUserProfiles = async () => {
    if (!classData?.members) return;
    const profiles: { [uid: string]: { username: string; name: string } } = {};
    
    console.log('[Leaderboard] Loading profiles for members:', classData.members);
    
    for (const memberIdOrEmail of classData.members) {
      try {
        // First, try to get user by UID directly
        let userDoc = null;
        let uid = memberIdOrEmail;
        
        try {
          const userRef = doc(db, 'users', memberIdOrEmail);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            userDoc = userSnap;
          }
        } catch (err) {
          // Not a valid UID, try email lookup
        }
        
        // If not found by UID, try to find by email
        if (!userDoc) {
          const usersQuery = query(collection(db, 'users'), where('email', '==', memberIdOrEmail));
          const usersSnap = await getDocs(usersQuery);
          if (!usersSnap.empty) {
            userDoc = usersSnap.docs[0];
            uid = usersSnap.docs[0].id;
          }
        }
        
        if (userDoc && userDoc.exists()) {
          const userData = userDoc.data();
          profiles[uid] = {
            username: userData.username || uid,
            name: userData.name || userData.username || uid
          };
          console.log(`[Leaderboard] Loaded profile for ${uid}:`, profiles[uid]);
        } else {
          console.log(`[Leaderboard] No profile found for ${memberIdOrEmail}`);
        }
      } catch (err) {
        console.error(`Failed to load profile for ${memberIdOrEmail}:`, err);
      }
    }
    
    console.log('[Leaderboard] All profiles loaded:', profiles);
    setUserProfiles(profiles);
  };

  const loadClassData = async (classId: string) => {
    const classInfo = localStorage.getItem(`qg_class_${classId}`);
    if (classInfo) {
      const parsedClass = JSON.parse(classInfo);
      setClassData(parsedClass);
      loadClassQuizzes(classId);
      return;
    }
    // Fallback: fetch from Firestore
    try {
      const classRef = doc(db, "classes", classId);
      const classSnap = await getDoc(classRef);
      if (classSnap.exists()) {
        const classDataFS = classSnap.data();
        setClassData({
          id: classId,
          name: classDataFS.name || "",
          description: classDataFS.description || "",
          code: classDataFS.code || "",
          createdBy: classDataFS.createdBy || "",
          createdAt: classDataFS.createdAt || "",
          members: classDataFS.members || [],
        });
        loadClassQuizzes(classId);
      } else {
        alert("Class not found!");
        window.location.href = "/classes";
      }
    } catch (err) {
      alert("Error loading class data");
      window.location.href = "/classes";
    }
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

  const loadLeaderboardData = async () => {
    if (!classData) return;
    // Fetch all quiz records for class members from Firestore
    try {
      // Convert member emails to UIDs
      const memberUids: string[] = [];
      for (const memberEmail of classData.members) {
        try {
          const usersQuery = query(collection(db, 'users'), where('email', '==', memberEmail));
          const usersSnap = await getDocs(usersQuery);
          if (!usersSnap.empty) {
            memberUids.push(usersSnap.docs[0].id);
          }
        } catch (err) {
          console.error(`Failed to get UID for ${memberEmail}:`, err);
        }
      }

      // Batch queries for >10 members
      const memberChunks = [];
      for (let i = 0; i < memberUids.length; i += 10) {
        memberChunks.push(memberUids.slice(i, i + 10));
      }
      let allMemberScores: QuizScore[] = [];
      for (const chunk of memberChunks) {
        const q = query(
          collection(db, "quizRecords"),
          where("userId", "in", chunk),
          orderBy("timestamp", "desc")
        );
        const snap = await getDocs(q);
        allMemberScores = allMemberScores.concat(await Promise.all(snap.docs.map(async (doc) => {
          const data = doc.data();
          // Use stored percentage or calculate if not available (for backward compatibility)
          let percentage = data.percentage || 0;
          if (!percentage && data.score !== undefined) {
            // Fetch quiz data from Firestore to calculate percentage
            try {
              const quiz = await getQuizById(data.quizId);
              if (quiz?.questions) {
                percentage = Math.round((data.score / quiz.questions.length) * 100);
              }
            } catch (err) {
              console.error(`Failed to fetch quiz ${data.quizId} for percentage calculation:`, err);
            }
          }
          
          return {
            username: data.userId,
            score: data.score || 0,
            percentage: percentage,
            completionTime: data.completionTime || 0,
            completedAt: data.timestamp?.seconds ? new Date(data.timestamp.seconds * 1000).toISOString() : data.timestamp,
            quizKey: data.quizId,
            quizTitle: data.quizTitle || data.quizId,
            mistakes: data.mistakes || [],
          };
        })));
      }
      setAllScores(allMemberScores);
      generateLeaderboard(allMemberScores);
    } catch (err) {
      console.error("Failed to fetch leaderboard records:", err);
    }
  };

  const generateLeaderboard = (scores: QuizScore[]) => {
    const memberStats: { [username: string]: LeaderboardEntry } = {};

    // Initialize all members
    classData?.members.forEach(member => {
      const profile = userProfiles[member] || { username: member, name: member };
      memberStats[member] = {
        username: profile.username,
        displayName: profile.name,
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-400">Login Required</h2>
          <p className="text-gray-700 dark:text-gray-200 mb-6">You must be logged in to view the class quiz leaderboard.</p>
          <Link href="/" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all">Go to Homepage</Link>
        </div>
      </div>
    );
  }
  if (!classData) {
    return <div>Loading...</div>;
  }

  const quizSpecificScores = getQuizSpecificScores();

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
                  <span className="text-white">Leaderboard</span>
                </h1>
                <p className="text-slate-300 text-lg">Track top performers in your class</p>
              </div>
              <Link href="/classes" className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:scale-105 transition-all duration-300 shadow-glow">
                My Classes
              </Link>
            </div>
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="glass-card rounded-3xl p-6 md:col-span-2 animate-slide-up">
            <h3 className="text-xl font-bold text-white mb-4">Leaderboard</h3>
            {selectedQuiz !== 'all' ? (
              <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 rounded-xl shadow-xl p-6">
                <h2 className="text-2xl font-bold mb-6 text-white">📝 {quizzes.find(q => q.key === selectedQuiz)?.quiz.title} - Member Records</h2>
                
                {/* Stats Overview - Moved to top */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/10 rounded-lg p-4 text-center border border-white/20">
                    <div className="text-2xl font-bold text-blue-400">
                      {quizSpecificScores.length}
                    </div>
                    <div className="text-sm text-purple-200">Total Attempts</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 text-center border border-white/20">
                    <div className="text-2xl font-bold text-green-400">
                      {quizSpecificScores.length > 0 ? Math.round(quizSpecificScores.reduce((sum, score) => sum + score.percentage, 0) / quizSpecificScores.length) : 0}%
                    </div>
                    <div className="text-sm text-purple-200">Average Score</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 text-center border border-white/20">
                    <div className="text-2xl font-bold text-yellow-400">
                      {quizSpecificScores.length > 0 ? Math.max(...quizSpecificScores.map(s => s.percentage)) : 0}%
                    </div>
                    <div className="text-sm text-purple-200">Highest Score</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 text-center border border-white/20">
                    <div className="text-2xl font-bold text-cyan-400">
                      {quizSpecificScores.length > 0 ? formatTime(Math.min(...quizSpecificScores.map(s => s.completionTime))) : '-'}
                    </div>
                    <div className="text-sm text-purple-200">Fastest Time</div>
                  </div>
                </div>
                
                <div className="bg-white/10 rounded-xl p-4">
                  {quizSpecificScores.length === 0 ? (
                    <div className="text-purple-200 text-center py-8">No records yet for this quiz. Be the first to complete it!</div>
                  ) : (
                    <ul className="divide-y divide-purple-300">
                      {quizSpecificScores.map((record) => {
                        const profile = userProfiles[record.username];
                        const displayName = profile?.name || profile?.username || record.username;
                        console.log('[Leaderboard] Rendering record:', { username: record.username, profile, displayName, allProfiles: userProfiles });
                        return (
                        <li
                          key={`${record.username}-${record.completedAt}`}
                          className="py-3 flex justify-between items-center cursor-pointer hover:bg-purple-900/20 rounded-lg px-2"
                          onClick={() => setSelectedRecord(record)}
                        >
                          <div>
                            <div className="font-semibold text-white">
                              User: {displayName}{record.username === (user?.uid || user?.displayName || user?.email) && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">You</span>}
                            </div>
                            <div className="text-purple-200 text-sm">
                              Score: {record.score} | {new Date(record.completedAt).toLocaleString()}
                            </div>
                            <div className="text-purple-200 text-sm">
                              Percentage: {record.percentage}% | Time: {formatTime(record.completionTime)}
                            </div>
                          </div>
                          <div className="text-purple-300">View Details →</div>
                        </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                {/* Member Record Details Modal */}
                {selectedRecord && (
                  <div className="fixed inset-0 bg-black bg-opacity-70 z-50 w-screen h-screen overflow-auto">
                    <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 rounded-none shadow-none p-8 w-full h-full relative border-none max-h-screen overflow-y-auto flex flex-col">
                      <div className="mb-8">
                        <nav className="bg-white/10 rounded-xl px-8 py-4 min-w-fit">
                          <span className="font-semibold text-white text-lg">
                            {userProfiles[selectedRecord.username]?.name || userProfiles[selectedRecord.username]?.username || selectedRecord.username}
                          </span>
                        </nav>
                      </div>
                      <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-200 text-2xl" onClick={() => setSelectedRecord(null)}>
                        ✖
                      </button>
                      <h3 className="text-2xl font-extrabold mb-4 text-purple-200">Quiz Record Details</h3>
                      <div className="mb-2 text-white font-bold text-lg">Quiz: {quizzes.find(q => q.key === selectedQuiz)?.quiz.title}</div>
                      <div className="mb-2 text-purple-200">Subject: {quizzes.find(q => q.key === selectedQuiz)?.quiz.subject}</div>
                      <div className="mb-2 text-purple-100">User: <span className="font-bold">{userProfiles[selectedRecord.username]?.name || userProfiles[selectedRecord.username]?.username || selectedRecord.username}</span></div>
                      <div className="mb-2 text-purple-100">Score: <span className="font-bold text-green-400">{selectedRecord.score}</span></div>
                      <div className="mb-2 text-purple-100">Date: {new Date(selectedRecord.completedAt).toLocaleString()}</div>
                      <div className="mb-6">
                        <div className="font-semibold mb-2 text-purple-300">Mistakes:</div>
                        {selectedRecord.mistakes && selectedRecord.mistakes.length > 0 ? (
                          <div className="space-y-4">
                            {selectedRecord.mistakes.map((m: any, idx: number) => (
                              <div key={idx} className="bg-white/10 rounded-lg p-4 border border-purple-800">
                                <div className="font-semibold text-white mb-2">Q{idx + 1}: {m.question}</div>
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
                                  <div className="text-purple-200">Your Answer: <span className="font-bold text-red-400">{typeof m.selected === "number" ? String.fromCharCode(65 + m.selected) : (m.selected === "@" ? "No answer" : m.selected)}</span></div>
                                  <div className="text-green-300">Correct: <span className="font-bold">{typeof m.correct === "number" ? String.fromCharCode(65 + m.correct) : m.correct}</span></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-green-400 font-bold">No mistakes! 🎉</div>
                        )}
                      </div>
                      <button className="mt-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow hover:bg-purple-700/80 transition-all text-lg" onClick={() => setSelectedRecord(null)}>
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Overall leaderboard */
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-bold text-gray-800">
                    🏆 Overall Class Rankings
                  </h2>
                </div>
                
                {/* Stats Overview - Moved to top */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 border-b bg-gray-50">
                  <div className="bg-white rounded-lg shadow p-4 text-center border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">
                      {leaderboard.filter(e => e.quizzesCompleted > 0).length}
                    </div>
                    <div className="text-sm text-gray-600">Active Players</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 text-center border border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                      {allScores.length}
                    </div>
                    <div className="text-sm text-gray-600">Total Attempts</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 text-center border border-purple-200">
                    <div className="text-2xl font-bold text-purple-600">
                      {quizzes.length}
                    </div>
                    <div className="text-sm text-gray-600">Available Quizzes</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 text-center border border-yellow-200">
                    <div className="text-2xl font-bold text-yellow-600">
                      {allScores.length > 0 ? Math.round(allScores.reduce((sum, score) => sum + score.percentage, 0) / allScores.length) : 0}%
                    </div>
                    <div className="text-sm text-gray-600">Class Average</div>
                  </div>
                </div>
                
                {leaderboard.filter(entry => entry.quizzesCompleted > 0).length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🏆</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Quiz Results Yet</h3>
                    <p className="text-gray-500 mb-4">Complete some quizzes to see the leaderboard!</p>
                    <div className="mt-8">
                      <h4 className="text-lg font-bold text-gray-400 mb-2">Class Members</h4>
                      <ul className="flex flex-wrap gap-4 justify-center">
                        {classData?.members.map(member => (
                          <li key={member} className="bg-gray-800 text-white px-4 py-2 rounded-full shadow">
                            {userProfiles[member]?.name || member}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link
                      href={`/classes/${classData.id}`}
                      className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-6"
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
                          <tr key={entry.username} className={entry.username === (user?.displayName || user?.email) ? 'bg-blue-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-lg">{getRankIcon(index + 1)}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
                                  {(entry.displayName || entry.username)[0].toUpperCase()}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {entry.displayName || entry.username}
                                    {entry.displayName && entry.displayName !== entry.username && (
                                      <div className="text-xs text-gray-500">@{entry.username}</div>
                                    )}
                                    {entry.username === (user?.displayName || user?.email) && (
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
          </div>
        </div>
      </div>
    </div>
  );
}
