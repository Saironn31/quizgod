﻿"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import SideNav from '@/components/SideNav';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getAllUserQuizzes, 
  deleteQuiz,
  FirebaseQuiz 
} from '@/lib/firestore';

interface ExtendedQuiz extends FirebaseQuiz {
  id: string;
  source?: 'personal' | 'class';
  className?: string;
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<ExtendedQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const { user } = useAuth();

  // Load preferences
  useEffect(() => {
    try {
      const { loadPreference } = require('@/utils/preferences');
      const savedSearch = loadPreference('quizzes_search');
      const savedSubject = loadPreference('quizzes_subjectFilter');
      if (savedSearch) setSearchTerm(savedSearch);
      if (savedSubject) setSelectedSubject(savedSubject);
    } catch (e) {
      // ignore
    }
  }, []);

  // Persist preferences
  useEffect(() => {
    try {
      const { savePreference } = require('@/utils/preferences');
      savePreference('quizzes_search', searchTerm);
      savePreference('quizzes_subjectFilter', selectedSubject);
    } catch (e) {
      // ignore
    }
  }, [searchTerm, selectedSubject]);

  useEffect(() => {
    if (!user?.uid || !user?.email) {
      setLoading(false);
      return;
    }
    loadQuizzes();
  }, [user]);

  const loadQuizzes = async () => {
    if (!user?.uid || !user?.email) return;
    
    try {
      setLoading(true);
      const allQuizzes = await getAllUserQuizzes(user.uid, user.email);
      
      // Transform to extended quiz format with source information
      const extendedQuizzes: ExtendedQuiz[] = allQuizzes.map(quiz => ({
        ...quiz,
        source: quiz.classId ? 'class' as const : 'personal' as const,
        className: quiz.classId ? 'Class Quiz' : undefined // You might want to fetch actual class name
      }));
      
      // Sort by creation date (newest first)
      extendedQuizzes.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      
      setQuizzes(extendedQuizzes);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (quizId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }
    
    if (!user?.uid) return;
    
    try {
      setDeleting(quizId);
      await deleteQuiz(quizId);
      
      // Remove from local state
      setQuizzes(quizzes.filter(q => q.id !== quizId));
    } catch (error) {
      console.error('Error deleting quiz:', error);
      alert("Failed to delete quiz. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  // Get unique subjects for filter with proper formatting
  const subjects = Array.from(new Set(quizzes.map(q => {
    if (q.source === 'class' && q.className) {
      return `${q.subject} (${q.className})`;
    }
    return q.subject;
  }))).filter(Boolean);

  // Filter quizzes based on search and subject
  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (quiz.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Handle subject filtering with proper format matching
    let matchesSubject = !selectedSubject;
    if (selectedSubject) {
      const quizSubjectDisplay = quiz.source === 'class' && quiz.className 
        ? `${quiz.subject} (${quiz.className})`
        : quiz.subject;
      matchesSubject = quizSubjectDisplay === selectedSubject;
    }
    
    return matchesSearch && matchesSubject;
  });

  const formatDate = (date?: Date | string) => {
    if (!date) return "Unknown date";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Replace NavBar and layout with homepage design
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full filter blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-500/10 rounded-full filter blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        </div>
        <div className="relative z-10 text-center px-4 animate-fade-in">
          <div className="mb-8 inline-block">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-400 via-violet-500 to-pink-500 flex items-center justify-center text-white text-5xl font-black animate-bounce-soft shadow-glow">
              Q
            </div>
          </div>
          <h1 className="text-6xl md:text-8xl font-black mb-6">
            <span className="gradient-text">Quizzes</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-2xl mx-auto">
            Please log in to view your quizzes
          </p>
          <Link href="/" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold text-lg hover:scale-105 transition-all duration-300 shadow-glow">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <SideNav />
      <div className="md:ml-64 min-h-screen p-4 md:p-8">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-500/5 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-violet-500/5 rounded-full filter blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
        </div>
        <div className="relative z-10 mb-8">
          <div className="glass-card rounded-3xl p-8 md:p-12 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-white/10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl md:text-6xl font-black mb-3">
                  <span className="text-white">My Quizzes</span>
                </h1>
                <p className="text-slate-300 text-lg">View and manage your quizzes</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="glass-card rounded-3xl p-6 md:col-span-2 animate-slide-up">
            <h3 className="text-xl font-bold text-white mb-4">Your Quizzes</h3>
            {/* Search and Filter */}
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg border border-purple-200 dark:border-purple-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Quizzes</label>
                  <input
                    type="text"
                    placeholder="Search by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 border border-purple-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filter by Subject</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full p-3 border border-purple-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                  >
                    <option value="">All Subjects</option>
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quiz Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 sm:mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold">{quizzes.length}</div>
                <div className="text-sm sm:text-base opacity-90">Total Quizzes</div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold">{subjects.length}</div>
                <div className="text-sm sm:text-base opacity-90">Subjects</div>
              </div>
            </div>

            {/* Quizzes List */}
            {loading ? (
              <div className="text-center p-12">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-purple-200">Loading your quizzes...</p>
              </div>
            ) : filteredQuizzes.length === 0 ? (
              <div className="text-center p-12 border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-lg">
                {quizzes.length === 0 ? (
                  <>
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-xl font-semibold text-white mb-2">No quizzes yet</h3>
                    <p className="text-purple-200 mb-4">Create your first quiz to get started!</p>
                    <Link 
                      href="/create" 
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-lg"
                    >
                      ➕ Create Your First Quiz
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-white mb-2">No quizzes found</h3>
                    <p className="text-purple-200">Try adjusting your search or filter criteria.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {filteredQuizzes.map((quiz) => (
                  <div key={quiz.id} className="bg-white dark:bg-gray-700 rounded-xl p-4 sm:p-6 border border-purple-100 dark:border-gray-600 hover:shadow-lg transition-all duration-200 group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                          {quiz.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                            📚 {quiz.source === 'class' && quiz.className ? `${quiz.subject} (${quiz.className})` : quiz.subject}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            quiz.source === 'class' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          }`}>
                            {quiz.source === 'class' ? `👥 ${quiz.className}` : '👤 Personal'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {quiz.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                        {quiz.description}
                      </p>
                    )}
                    
                    <div className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <span className="w-5 h-5 mr-2">❓</span>
                        <span>{quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-5 h-5 mr-2">📅</span>
                        <span>Created {formatDate(quiz.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Link 
                        href={`/quizzes/${quiz.id}`} 
                        className="w-full sm:flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-center rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md text-sm font-medium"
                      >
                        🎮 Play
                      </Link>
                      {quiz.source === 'personal' && (
                        <button
                          onClick={() => {
                            const url = `${window.location.origin}/quizzes/${quiz.id}`;
                            navigator.clipboard.writeText(url);
                            alert('Quiz link copied to clipboard!');
                          }}
                          className="w-full sm:px-4 sm:py-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md text-sm font-medium"
                          title="Share quiz link"
                        >
                          🔗 Share
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(quiz.id, quiz.title)}
                        disabled={deleting === quiz.id}
                        className="sm:w-auto w-full px-2 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-md hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm text-xs font-medium disabled:opacity-50"
                        title="Delete quiz"
                      >
                        {deleting === quiz.id ? "⏳" : "🗑️"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}