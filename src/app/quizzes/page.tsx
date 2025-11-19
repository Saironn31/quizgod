"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import SideNav from '@/components/SideNav';
import AdsterraNative from '@/components/AdsterraNative';
import AdsterraAd from '@/components/AdsterraAd';
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
  const { user, userProfile } = useAuth();

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
                  <span className="text-white">My Quizzes</span>
                </h1>
                <p className="text-slate-300 text-lg">View and manage your quizzes</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 mb-20">
          <div className="glass-card rounded-3xl p-6 animate-slide-up">
            <h3 className="text-xl font-bold text-white mb-4">Your Quizzes</h3>
            {/* Search and Filter */}
            <div className="mb-6 md:mb-8 p-4 md:p-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg border border-purple-200 dark:border-purple-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Quizzes</label>
                  <input
                    type="text"
                    placeholder="Search by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 md:p-3 text-sm md:text-base border border-purple-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-white mb-2">Filter by Subject</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full p-2 md:p-3 text-sm md:text-base rounded-xl bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all duration-200 hover:bg-white/[0.12] hover:border-white/30 active:scale-[0.99] cursor-pointer [&>option]:bg-slate-800 [&>option]:text-white [&>option]:py-2 [&>option]:px-4"
                  >
                    <option value="">All Subjects</option>
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quiz Stats - Bento Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
              <div className="glass-card rounded-xl p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-400/30 hover:scale-105 transition-all">
                <div className="text-xs text-blue-200 mb-1 font-medium">Total Quizzes</div>
                <div className="text-2xl md:text-3xl font-black text-blue-300">{quizzes.length}</div>
                <div className="text-xs text-blue-300/60 mt-1">Created</div>
              </div>
              <div className="glass-card rounded-xl p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-400/30 hover:scale-105 transition-all">
                <div className="text-xs text-green-200 mb-1 font-medium">Subjects</div>
                <div className="text-2xl md:text-3xl font-black text-green-300">{subjects.length}</div>
                <div className="text-xs text-green-300/60 mt-1">Topics</div>
              </div>
              <div className="glass-card rounded-xl p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-400/30 hover:scale-105 transition-all">
                <div className="text-xs text-purple-200 mb-1 font-medium">Questions</div>
                <div className="text-2xl md:text-3xl font-black text-purple-300">
                  {quizzes.reduce((total, q) => total + q.questions.length, 0)}
                </div>
                <div className="text-xs text-purple-300/60 mt-1">Total</div>
              </div>
            </div>

            {/* Quizzes List */}
            {loading ? (
              <div className="text-center p-12">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mb-4"></div>
                <p className="text-purple-200 text-lg font-medium">Loading your quizzes...</p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredQuizzes.map((quiz, index) => (
                  <React.Fragment key={quiz.id}>
                    {/* Native Ad every 6 quizzes */}
                    {index > 0 && index % 6 === 0 && (
                      <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 flex justify-center">
                        <AdsterraNative />
                      </div>
                    )}
                    <div className="bg-white dark:bg-gray-700 rounded-xl p-4 md:p-5 border border-purple-100 dark:border-gray-600 hover:shadow-lg transition-all duration-200 group flex flex-col">
                    <div className="flex justify-between items-start mb-3 md:mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2 break-words">
                          {quiz.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-2 text-xs md:text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                          <span className="inline-flex items-center px-2 py-0.5 md:py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 whitespace-nowrap">
                            📚 {quiz.subject}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 md:py-1 rounded-full text-xs font-medium whitespace-nowrap ${
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
                      <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2">
                        {quiz.description}
                      </p>
                    )}
                    
                    <div className="space-y-1.5 md:space-y-2 mb-3 md:mb-4 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <span className="w-4 h-4 md:w-5 md:h-5 mr-2">❓</span>
                        <span>{quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-4 h-4 md:w-5 md:h-5 mr-2">📅</span>
                        <span className="truncate">Created {formatDate(quiz.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-auto">
                      <Link 
                        href={`/quizzes/${quiz.id}`} 
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-center rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md text-xs md:text-sm font-medium"
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
                          className="px-2.5 md:px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md text-xs md:text-sm font-medium shrink-0"
                          title="Share quiz link"
                        >
                          🔗
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(quiz.id, quiz.title)}
                        disabled={deleting === quiz.id}
                        className="px-2.5 md:px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md text-xs md:text-sm font-medium disabled:opacity-50 shrink-0"
                        title="Delete quiz"
                      >
                        {deleting === quiz.id ? "⏳" : "🗑️"}
                      </button>
                    </div>
                  </div>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Center Ad - Only for non-premium users */}
      {!userProfile?.isPremium && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <AdsterraAd 
            atOptions={{
              key: 'e478b629ee3a3e02c8e9579be23fe46d',
              format: 'iframe',
              height: 90,
              width: 728,
              params: {}
            }}
          />
        </div>
      )}
    </div>
  );
}