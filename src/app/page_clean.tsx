"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Plus, BookOpen, Users } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import NavBar from "@/components/NavBar";

export default function HomePage() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem("qg_user");
    setIsLoggedIn(!!u);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 text-white">
      <div className="container mx-auto px-6 py-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-yellow-300" />
            <span className="text-2xl font-bold">QuizGod Free</span>
          </div>
          {isLoggedIn ? (
            <NavBar />
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => { setAuthMode("login"); setShowAuth(true); }}
                className="px-4 py-2 rounded-full border border-white/30 hover:bg-white/10"
              >Login</button>
              <button
                onClick={() => { setAuthMode("signup"); setShowAuth(true); }}
                className="px-4 py-2 rounded-full bg-purple-500 hover:bg-purple-600"
              >Sign Up Free</button>
            </div>
          )}
        </div>

        <div className="text-center mt-20">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">Create, Manage, and Play Quizzes</h1>
          <p className="mt-4 text-lg text-purple-100">100% free. Manual quiz builder, subjects, and your quiz library.</p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/10 rounded-xl p-6">
              <Plus className="w-10 h-10 text-yellow-300 mx-auto mb-3" />
              <h3 className="text-xl font-semibold mb-2">Manual Quiz Creation</h3>
              <p>Create custom quizzes question-by-question with 4 options.</p>
            </div>
            <div className="bg-white/10 rounded-xl p-6">
              <BookOpen className="w-10 h-10 text-yellow-300 mx-auto mb-3" />
              <h3 className="text-xl font-semibold mb-2">Subjects</h3>
              <p>Organize your quizzes with add/delete subjects.</p>
            </div>
            <div className="bg-white/10 rounded-xl p-6">
              <Users className="w-10 h-10 text-yellow-300 mx-auto mb-3" />
              <h3 className="text-xl font-semibold mb-2">My Quizzes</h3>
              <p>See, play, and delete your quizzes anytime.</p>
            </div>
          </div>

          {isLoggedIn && (
            <div className="mt-10 flex justify-center gap-4">
              <Link href="/create" className="px-6 py-3 bg-purple-500 rounded-lg hover:bg-purple-600">Create Quiz</Link>
              <Link href="/subjects" className="px-6 py-3 bg-blue-500 rounded-lg hover:bg-blue-600">Manage Subjects</Link>
              <Link href="/quizzes" className="px-6 py-3 bg-green-500 rounded-lg hover:bg-green-600">My Quizzes</Link>
            </div>
          )}
        </div>
      </div>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
