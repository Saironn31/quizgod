﻿"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "../../components/ThemeToggle";
import { useAuth } from '@/contexts/AuthContext';

interface Quiz {
  title: string;
  subject: string;
  description?: string;
  questions: { question: string; options: string[]; correct: number }[];
  createdAt?: string;
  source?: 'personal' | 'class';
  className?: string;
}

interface QuizWithKey {
  key: string;
  quiz: Quiz;
}

interface LocalClass {
  id: string;
  name: string;
  members: string[];
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizWithKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load individual user quizzes
      const userQuizKeys = Object.keys(localStorage).filter(k => k.startsWith(`qg_quiz_${user.email}_`));
      const userQuizzes = userQuizKeys.map(k => {
        const quiz = JSON.parse(localStorage.getItem(k)!);
        return { key: k, quiz: { ...quiz, source: 'personal' } };
      });

      // Load class quizzes that user has access to
      const allClasses = JSON.parse(localStorage.getItem("qg_all_classes") || "[]");
      const userClasses = allClasses.filter((classInfo: LocalClass) => 
        classInfo.members && user.email && classInfo.members.includes(user.email)
      );

      const classQuizzes: QuizWithKey[] = [];
      userClasses.forEach((classInfo: LocalClass) => {
        const classQuizKeys = JSON.parse(localStorage.getItem(`qg_class_quizzes_${classInfo.id}`) || "[]");
        classQuizKeys.forEach((quizKey: string) => {
          const quiz = localStorage.getItem(quizKey);
          if (quiz) {
            const parsedQuiz = JSON.parse(quiz);
            classQuizzes.push({ 
              key: quizKey, 
              quiz: { ...parsedQuiz, source: 'class', className: classInfo.name } 
            });
          }
        });
      });

      // Combine all quizzes and remove duplicates
      const allQuizzes = [...userQuizzes, ...classQuizzes];
      const uniqueQuizzes = allQuizzes.filter((quiz, index, self) => 
        index === self.findIndex(q => q.key === quiz.key)
      );
      
      // Sort by creation date (newest first)
      uniqueQuizzes.sort((a, b) => {
        const dateA = new Date(a.quiz.createdAt || 0).getTime();
        const dateB = new Date(b.quiz.createdAt || 0).getTime();
        return dateB - dateA;
      });
      
      setQuizzes(uniqueQuizzes);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleDelete = (key: string) => {
    if (window.confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) {
      localStorage.removeItem(key);
      setQuizzes(quizzes.filter(q => q.key !== key));
    }
  };

  // Get unique subjects for filter with proper formatting
  const subjects = Array.from(new Set(quizzes.map(q => {
    if (q.quiz.source === 'class' && q.quiz.className) {
      return `"${q.quiz.subject}" ("${q.quiz.className}")`;
    }
    return q.quiz.subject;
  }))).filter(Boolean);

  // Filter quizzes based on search and subject
  const filteredQuizzes = quizzes.filter(({ quiz }) => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (quiz.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Handle subject filtering with proper format matching
    let matchesSubject = !selectedSubject;
    if (selectedSubject) {
      const quizSubjectDisplay = quiz.source === 'class' && quiz.className 
        ? `"${quiz.subject}" ("${quiz.className}")`
        : quiz.subject;
      matchesSubject = quizSubjectDisplay === selectedSubject;
    }
    
    return matchesSearch && matchesSubject;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown date";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Please log in to view your quizzes</h1>
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm border-b border-purple-100 dark:border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link href="/" className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
            🧠 QuizGod
          </Link>
          <div className="hidden lg:flex items-center space-x-4">
            <Link href="/create" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400">
              Create Quiz
            </Link>
            <Link href="/subjects" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400">
              Subjects
            </Link>
            <Link href="/quizzes" className="text-purple-600 dark:text-purple-400 font-semibold">
              My Quizzes
            </Link>
            <Link href="/classes" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400">
              Classes
            </Link>
            <Link href="/ai-quiz" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400">
              Smart Quiz
            </Link>
            <ThemeToggle />
            <span className="text-gray-700 dark:text-gray-300 text-sm truncate max-w-32">Welcome, {user.email}!</span>
            <button
              onClick={() => {
                window.location.href = "/";
              }}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 text-sm"
            >
              Logout
            </button>
          </div>
          {/* Mobile menu */}
          <div className="lg:hidden flex items-center gap-2">
            <ThemeToggle />
            <Link href="/" className="text-sm bg-purple-500 text-white px-3 py-2 rounded">Menu</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-gray-700 p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200">🎮 My Quizzes</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and play your created quizzes</p>
            </div>
            <Link 
              href="/create" 
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-lg text-center"
            >
              ➕ Create New Quiz
            </Link>
          </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold">{quizzes.length}</div>
              <div className="text-sm sm:text-base opacity-90">Total Quizzes</div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold">{subjects.length}</div>
              <div className="text-sm sm:text-base opacity-90">Subjects</div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold">
                {quizzes.reduce((total, q) => total + q.quiz.questions.length, 0)}
              </div>
              <div className="text-sm sm:text-base opacity-90">Total Questions</div>
            </div>
          </div>

          {/* Quizzes List */}
          {loading ? (
            <div className="text-center p-12">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-gray-500 dark:text-gray-400">Loading your quizzes...</p>
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="text-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              {quizzes.length === 0 ? (
                <>
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">No quizzes yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first quiz to get started!</p>
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
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">No quizzes found</h3>
                  <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria.</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredQuizzes.map(({ key, quiz }) => (
                <div key={key} className="bg-white dark:bg-gray-700 rounded-xl p-4 sm:p-6 border border-purple-100 dark:border-gray-600 hover:shadow-lg transition-all duration-200 group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                        {quiz.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                          📚 {quiz.source === 'class' && quiz.className ? `"${quiz.subject}" ("${quiz.className}")` : quiz.subject}
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
                  
                  <div className="flex gap-2">
                    <Link 
                      href={`/quizzes/${key}`} 
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-center rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md text-sm font-medium"
                    >
                      🎮 Play
                    </Link>
                    <button 
                      onClick={() => handleDelete(key)} 
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md text-sm font-medium"
                      title="Delete quiz"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
