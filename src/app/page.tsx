"use client";
import React, { useState } from "react";
import Link from "next/link";
import AuthModal from "@/components/AuthModal";
import NavBar from "@/components/NavBar";
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const [showAuth, setShowAuth] = useState(false);
  const { user } = useAuth();

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
            <div className="bg-white/10 rounded-xl p-4 sm:p-6">
              <div className="text-3xl sm:text-4xl text-center mb-3">➕</div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Manual Quiz Creation</h3>
              <p className="text-sm sm:text-base">Create custom quizzes question-by-question with 4 options.</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 sm:p-6">
              <div className="text-3xl sm:text-4xl text-center mb-3">🤖</div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">AI Quiz Generator</h3>
              <p className="text-sm sm:text-base">Upload PDFs and let AI automatically generate quiz questions!</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 sm:p-6">
              <div className="text-3xl sm:text-4xl text-center mb-3">📚</div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Subjects</h3>
              <p className="text-sm sm:text-base">Organize your quizzes with add/delete subjects.</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 sm:p-6">
              <div className="text-3xl sm:text-4xl text-center mb-3">🎮</div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">My Quizzes</h3>
              <p className="text-sm sm:text-base">See, play, and delete your quizzes anytime.</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
              <div className="text-3xl sm:text-4xl text-center mb-3">👥</div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Classes</h3>
              <p className="text-sm sm:text-base">Create or join classes to collaborate and compete with classmates!</p>
            </div>
          </div>

          {user && (
            <div className="mt-8 sm:mt-10 flex justify-center gap-3 sm:gap-4 flex-wrap px-4">
              <Link href="/create" className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors">Create Quiz</Link>
              <Link href="/ai-quiz" className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-colors">🤖 AI Quiz</Link>
              <Link href="/subjects" className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">Manage Subjects</Link>
              <Link href="/quizzes" className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-green-500 rounded-lg hover:bg-green-600 transition-colors">My Quizzes</Link>
              <Link href="/classes" className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors">👥 Classes</Link>
            </div>
          )}
        </div>
      </div>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
