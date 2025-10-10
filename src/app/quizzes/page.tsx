"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import NavBar from '@/components/NavBar';
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Please log in to view your quizzes</h1>
              <Link href="/" className="text-blue-400 hover:underline">
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 sm:mb-12 gap-4">
          <div className="text-xl sm:text-2xl font-bold text-white">� QuizGod</div>
          <div className="w-full sm:w-auto">
            <NavBar />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">🎮 My Quizzes</h1>
                <p className="text-purple-200 mt-1">Manage and play your created quizzes</p>
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
                        className="w-full sm:px-4 sm:py-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md text-sm font-medium disabled:opacity-50"
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