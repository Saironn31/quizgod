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
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-12">
          <div className="text-2xl font-bold text-white">🧠 QuizGod</div>
          {user ? (
            <NavBar />
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setShowAuth(true)}
                className="px-4 py-2 rounded-full border border-white/30 hover:bg-white/10 dark:border-gray-400 dark:hover:bg-gray-700/30 transition-colors"
              >Login / Sign Up</button>
            </div>
          )}
        </div>

        <div className="text-center mt-20">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">Create, Manage, and Play Quizzes</h1>
          <p className="mt-4 text-lg text-purple-100">100% free. Manual quiz builder, subjects, and your quiz library.</p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
            <div className="bg-white/10 rounded-xl p-6">
              <div className="text-4xl text-center mb-3">➕</div>
              <h3 className="text-xl font-semibold mb-2">Manual Quiz Creation</h3>
              <p>Create custom quizzes question-by-question with 4 options.</p>
            </div>
            <div className="bg-white/10 rounded-xl p-6">
              <div className="text-4xl text-center mb-3">🤖</div>
              <h3 className="text-xl font-semibold mb-2">AI Quiz Generator</h3>
              <p>Upload PDFs and let AI automatically generate quiz questions!</p>
            </div>
            <div className="bg-white/10 rounded-xl p-6">
              <div className="text-4xl text-center mb-3">📚</div>
              <h3 className="text-xl font-semibold mb-2">Subjects</h3>
              <p>Organize your quizzes with add/delete subjects.</p>
            </div>
            <div className="bg-white/10 rounded-xl p-6">
              <div className="text-4xl text-center mb-3">🎮</div>
              <h3 className="text-xl font-semibold mb-2">My Quizzes</h3>
              <p>See, play, and delete your quizzes anytime.</p>
            </div>
            <div className="bg-white/10 rounded-xl p-6">
              <div className="text-4xl text-center mb-3">👥</div>
              <h3 className="text-xl font-semibold mb-2">Classes</h3>
              <p>Create or join classes to collaborate and compete with classmates!</p>
            </div>
          </div>

          {user && (
            <div className="mt-10 flex justify-center gap-4 flex-wrap">
              <Link href="/create" className="px-6 py-3 bg-purple-500 rounded-lg hover:bg-purple-600">Create Quiz</Link>
              <Link href="/ai-quiz" className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg hover:from-pink-600 hover:to-purple-700">🤖 AI Quiz</Link>
              <Link href="/subjects" className="px-6 py-3 bg-blue-500 rounded-lg hover:bg-blue-600">Manage Subjects</Link>
              <Link href="/quizzes" className="px-6 py-3 bg-green-500 rounded-lg hover:bg-green-600">My Quizzes</Link>
              <Link href="/classes" className="px-6 py-3 bg-orange-500 rounded-lg hover:bg-orange-600">👥 Classes</Link>
            </div>
          )}
        </div>
      </div>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
