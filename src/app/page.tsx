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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-dark to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand-primary/20 rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-secondary/20 rounded-full filter blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-accent/10 rounded-full filter blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-8 sm:mb-12 animate-slide-in">
          <div className="text-2xl sm:text-3xl font-black tracking-tight">
            <span className="gradient-text">QuizMaster</span>
          </div>
          {user ? (
            <NavBar />
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setShowAuth(true)}
                className="px-6 py-2.5 rounded-xl glass-button font-medium text-white hover:scale-105 transition-all duration-300 shadow-glow"
              >
                Get Started
              </button>
            </div>
          )}
        </div>

        <div className="text-center mt-12 sm:mt-20 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight px-2 mb-6">
            <span className="text-white">Master Your </span>
            <span className="gradient-text">Knowledge</span>
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-slate-300 px-4 max-w-2xl mx-auto">
            Create intelligent quizzes, collaborate with peers, and track your learning journey
          </p>

          <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto px-2">
            {user ? (
              <Link href="/create" className="group glass-card rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:scale-105 hover:shadow-glow cursor-pointer animate-slide-up">
                <div className="text-4xl sm:text-5xl text-center mb-4 group-hover:animate-bounce-soft transition-transform">✨</div>
                <h3 className="text-lg sm:text-xl font-bold mb-3 text-white">Create Quiz</h3>
                <p className="text-sm sm:text-base text-slate-300">Design custom quizzes with multiple-choice questions</p>
              </Link>
            ) : (
              <div className="glass-card rounded-2xl p-6 sm:p-8 animate-slide-up">
                <div className="text-4xl sm:text-5xl text-center mb-4">✨</div>
                <h3 className="text-lg sm:text-xl font-bold mb-3 text-white">Create Quiz</h3>
                <p className="text-sm sm:text-base text-slate-300">Design custom quizzes with multiple-choice questions</p>
              </div>
            )}
            {user ? (
              <Link href="/ai-quiz" className="group glass-card rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:scale-105 hover:shadow-glow-purple cursor-pointer animate-slide-up" style={{animationDelay: '0.1s'}}>
                <div className="text-4xl sm:text-5xl text-center mb-4 group-hover:animate-bounce-soft transition-transform">🤖</div>
                <h3 className="text-lg sm:text-xl font-bold mb-3 text-white">AI Generator</h3>
                <p className="text-sm sm:text-base text-slate-300">Generate quizzes automatically from your documents</p>
              </Link>
            ) : (
              <div className="glass-card rounded-2xl p-6 sm:p-8 animate-slide-up" style={{animationDelay: '0.1s'}}>
                <div className="text-4xl sm:text-5xl text-center mb-4">🤖</div>
                <h3 className="text-lg sm:text-xl font-bold mb-3 text-white">AI Generator</h3>
                <p className="text-sm sm:text-base text-slate-300">Generate quizzes automatically from your documents</p>
              </div>
            )}
            {user ? (
              <Link href="/subjects" className="group glass-card rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:scale-105 hover:shadow-glow cursor-pointer animate-slide-up" style={{animationDelay: '0.2s'}}>
                <div className="text-4xl sm:text-5xl text-center mb-4 group-hover:animate-bounce-soft transition-transform">📚</div>
                <h3 className="text-lg sm:text-xl font-bold mb-3 text-white">Subjects</h3>
                <p className="text-sm sm:text-base text-slate-300">Organize your content by subject categories</p>
              </Link>
            ) : (
              <div className="glass-card rounded-2xl p-6 sm:p-8 animate-slide-up" style={{animationDelay: '0.2s'}}>
                <div className="text-4xl sm:text-5xl text-center mb-4">📚</div>
                <h3 className="text-lg sm:text-xl font-bold mb-3 text-white">Subjects</h3>
                <p className="text-sm sm:text-base text-slate-300">Organize your content by subject categories</p>
              </div>
            )}
            {user ? (
              <Link href="/quizzes" className="group glass-card rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:scale-105 hover:shadow-glow-purple cursor-pointer animate-slide-up" style={{animationDelay: '0.3s'}}>
                <div className="text-4xl sm:text-5xl text-center mb-4 group-hover:animate-bounce-soft transition-transform">�</div>
                <h3 className="text-lg sm:text-xl font-bold mb-3 text-white">My Quizzes</h3>
                <p className="text-sm sm:text-base text-slate-300">Access and manage all your created quizzes</p>
              </Link>
            ) : (
              <div className="glass-card rounded-2xl p-6 sm:p-8 animate-slide-up" style={{animationDelay: '0.3s'}}>
                <div className="text-4xl sm:text-5xl text-center mb-4">�</div>
                <h3 className="text-lg sm:text-xl font-bold mb-3 text-white">My Quizzes</h3>
                <p className="text-sm sm:text-base text-slate-300">Access and manage all your created quizzes</p>
              </div>
            )}
            {user ? (
              <Link href="/classes" className="group glass-card rounded-2xl p-6 sm:p-8 sm:col-span-2 lg:col-span-1 transition-all duration-300 hover:scale-105 hover:shadow-glow-green cursor-pointer animate-slide-up" style={{animationDelay: '0.4s'}}>
                <div className="text-4xl sm:text-5xl text-center mb-4 group-hover:animate-bounce-soft transition-transform">🏫</div>
                <h3 className="text-lg sm:text-xl font-bold mb-3 text-white">Classes</h3>
                <p className="text-sm sm:text-base text-slate-300">Join classes and compete with your peers</p>
              </Link>
            ) : (
              <div className="glass-card rounded-2xl p-6 sm:p-8 sm:col-span-2 lg:col-span-1 animate-slide-up" style={{animationDelay: '0.4s'}}>
                <div className="text-4xl sm:text-5xl text-center mb-4">🏫</div>
                <h3 className="text-lg sm:text-xl font-bold mb-3 text-white">Classes</h3>
                <p className="text-sm sm:text-base text-slate-300">Join classes and compete with your peers</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}

