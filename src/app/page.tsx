"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import AuthModal from "@/components/AuthModal";
import NavBar from "@/components/NavBar";
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function HomePage() {
  const [showAuth, setShowAuth] = useState(false);
  const { user } = useAuth();
  const [quizRecords, setQuizRecords] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [loadingRecords, setLoadingRecords] = useState(false);

  useEffect(() => {
    const fetchRecords = async () => {
      if (!user?.uid) return;
      setLoadingRecords(true);
      try {
        const q = query(
          collection(db, 'quizRecords'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );
        const snap = await getDocs(q);
        setQuizRecords(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error('Failed to fetch quiz records:', err);
      } finally {
        setLoadingRecords(false);
      }
    };
    if (user?.uid) fetchRecords();
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex justify-between items-center mb-8 sm:mb-12">
          <div className="text-xl sm:text-2xl font-bold text-white">🧠 QuizGod</div>
          {user ? (
            <NavBar />
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setShowAuth(true)}
                className="px-3 sm:px-4 py-2 text-sm sm:text-base rounded-full border border-white/30 hover:bg-white/10 dark:border-gray-400 dark:hover:bg-gray-700/30 transition-colors"
              >Login / Sign Up</button>
            </div>
          )}
        </div>

        <div className="text-center mt-12 sm:mt-20">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight px-2">Create, Manage, and Play Quizzes</h1>
          <p className="mt-4 text-base sm:text-lg text-purple-100 px-4">100% free. Manual quiz builder, subjects, and your quiz library.</p>

          <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 max-w-7xl mx-auto px-2">
            {user ? (
              <Link href="/create" className="bg-white/10 hover:bg-white/20 rounded-xl p-4 sm:p-6 transition-all duration-200 hover:scale-105 cursor-pointer">
                <div className="text-3xl sm:text-4xl text-center mb-3">➕</div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Manual Quiz Creation</h3>
                <p className="text-sm sm:text-base">Create custom quizzes question-by-question with 4 options.</p>
              </Link>
            ) : (
              <div className="bg-white/10 rounded-xl p-4 sm:p-6">
                <div className="text-3xl sm:text-4xl text-center mb-3">➕</div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Manual Quiz Creation</h3>
                <p className="text-sm sm:text-base">Create custom quizzes question-by-question with 4 options.</p>
              </div>
            )}
            {user ? (
              <Link href="/ai-quiz" className="bg-white/10 hover:bg-white/20 rounded-xl p-4 sm:p-6 transition-all duration-200 hover:scale-105 cursor-pointer">
                <div className="text-3xl sm:text-4xl text-center mb-3">🤖</div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">AI Quiz Generator</h3>
                <p className="text-sm sm:text-base">Upload PDFs and let AI automatically generate quiz questions!</p>
              </Link>
            ) : (
              <div className="bg-white/10 rounded-xl p-4 sm:p-6">
                <div className="text-3xl sm:text-4xl text-center mb-3">🤖</div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">AI Quiz Generator</h3>
                <p className="text-sm sm:text-base">Upload PDFs and let AI automatically generate quiz questions!</p>
              </div>
            )}
            {user ? (
              <Link href="/subjects" className="bg-white/10 hover:bg-white/20 rounded-xl p-4 sm:p-6 transition-all duration-200 hover:scale-105 cursor-pointer">
                <div className="text-3xl sm:text-4xl text-center mb-3">📚</div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Subjects</h3>
                <p className="text-sm sm:text-base">Organize your quizzes with add/delete subjects.</p>
              </Link>
            ) : (
              <div className="bg-white/10 rounded-xl p-4 sm:p-6">
                <div className="text-3xl sm:text-4xl text-center mb-3">📚</div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Subjects</h3>
                <p className="text-sm sm:text-base">Organize your quizzes with add/delete subjects.</p>
              </div>
            )}
            {user ? (
              <Link href="/quizzes" className="bg-white/10 hover:bg-white/20 rounded-xl p-4 sm:p-6 transition-all duration-200 hover:scale-105 cursor-pointer">
                <div className="text-3xl sm:text-4xl text-center mb-3">🎮</div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">My Quizzes</h3>
                <p className="text-sm sm:text-base">See, play, and delete your quizzes anytime.</p>
              </Link>
            ) : (
              <div className="bg-white/10 rounded-xl p-4 sm:p-6">
                <div className="text-3xl sm:text-4xl text-center mb-3">🎮</div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">My Quizzes</h3>
                <p className="text-sm sm:text-base">See, play, and delete your quizzes anytime.</p>
              </div>
            )}
            {user ? (
              <Link href="/classes" className="bg-white/10 hover:bg-white/20 rounded-xl p-4 sm:p-6 sm:col-span-2 lg:col-span-1 transition-all duration-200 hover:scale-105 cursor-pointer">
                <div className="text-3xl sm:text-4xl text-center mb-3">👥</div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Classes</h3>
                <p className="text-sm sm:text-base">Create or join classes to collaborate and compete with classmates!</p>
              </Link>
            ) : (
              <div className="bg-white/10 rounded-xl p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
                <div className="text-3xl sm:text-4xl text-center mb-3">👥</div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Classes</h3>
                <p className="text-sm sm:text-base">Create or join classes to collaborate and compete with classmates!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quiz Records Section */}
      {user && (
        <div className="max-w-3xl mx-auto mt-12">
          <h2 className="text-2xl font-bold mb-4 text-white">📊 Your Quiz Records</h2>
          {loadingRecords ? (
            <div className="text-purple-200">Loading records...</div>
          ) : quizRecords.length === 0 ? (
            <div className="text-purple-200">No quiz records found. Play a quiz to see your results here!</div>
          ) : (
            <div className="bg-white/10 rounded-xl p-4">
              <ul className="divide-y divide-purple-300">
                {quizRecords.map(record => (
                  <li key={record.id} className="py-3 flex justify-between items-center cursor-pointer hover:bg-purple-900/20 rounded-lg px-2" onClick={() => setSelectedRecord(record)}>
                    <div>
                      <div className="font-semibold text-white">Quiz: {record.quizId}</div>
                      <div className="text-purple-200 text-sm">Score: {record.score} | {new Date(record.timestamp.seconds ? record.timestamp.seconds * 1000 : record.timestamp).toLocaleString()}</div>
                    </div>
                    <div className="text-purple-300">View Details →</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Record Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-8 max-w-lg w-full relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setSelectedRecord(null)}>
              ✖
            </button>
            <h3 className="text-xl font-bold mb-2 text-purple-700 dark:text-purple-300">Quiz Record Details</h3>
            <div className="mb-2 text-gray-700 dark:text-gray-200">Quiz ID: {selectedRecord.quizId}</div>
            <div className="mb-2 text-gray-700 dark:text-gray-200">Score: {selectedRecord.score}</div>
            <div className="mb-2 text-gray-700 dark:text-gray-200">Date: {new Date(selectedRecord.timestamp.seconds ? selectedRecord.timestamp.seconds * 1000 : selectedRecord.timestamp).toLocaleString()}</div>
            <div className="mb-4">
              <div className="font-semibold mb-1">Mistakes:</div>
              {selectedRecord.mistakes.length === 0 ? (
                <div className="text-green-500">No mistakes! 🎉</div>
              ) : (
                <ul className="list-disc ml-6 text-red-500">
                  {selectedRecord.mistakes.map((m: any, idx: number) => (
                    <li key={idx}>
                      Q: {m.question}<br />Your Answer: {typeof m.selected === 'number' ? String.fromCharCode(65 + m.selected) : m.selected}<br />Correct: {typeof m.correct === 'number' ? String.fromCharCode(65 + m.correct) : m.correct}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg" onClick={() => setSelectedRecord(null)}>Close</button>
          </div>
        </div>
      )}

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );

