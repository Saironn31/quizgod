"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import NavBar from '@/components/NavBar';
import { useAuth } from '@/contexts/AuthContext';
import { 
  createSubject, 
  getAllUserSubjects,
  deleteSubject, 
  FirebaseSubject,
  getUserClasses
} from '@/lib/firestore';

interface ExtendedFirebaseSubject extends FirebaseSubject {
  source?: 'personal' | 'class';
  className?: string;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<ExtendedFirebaseSubject[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid || !user?.email) {
      setLoading(false);
      return;
    }
    loadSubjects();
  }, [user]);

  const loadSubjects = async () => {
    if (!user?.uid || !user?.email) return;
    
    try {
      setLoading(true);
      
      // Load all subjects (personal + class subjects)
      const allSubjects = await getAllUserSubjects(user.uid, user.email);
      
      // Load user classes to get class names
      const userClasses = await getUserClasses(user.email);
      
      // Mark subjects with their source and class name
      const extendedSubjects: ExtendedFirebaseSubject[] = allSubjects.map(subject => {
        if (subject.classId) {
          const parentClass = userClasses.find(c => c.id === subject.classId);
          return {
            ...subject,
            source: 'class' as const,
            className: parentClass?.name || 'Unknown Class'
          };
        } else {
          return {
            ...subject,
            source: 'personal' as const
          };
        }
      });
      
      // Sort by creation date (newest first)
      extendedSubjects.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      
      setSubjects(extendedSubjects);
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSubject = async () => {
    if (!name.trim() || !user?.uid) {
      alert("Please enter a subject name");
      return;
    }

    // Check if subject already exists
    const subjectExists = subjects.some(subject => 
      subject.name.toLowerCase() === name.toLowerCase() && subject.source === 'personal'
    );
    if (subjectExists) {
      alert("A personal subject with this name already exists!");
      return;
    }

    try {
      setCreating(true);
      await createSubject(name.trim(), user.uid);
      
      // Reload subjects to show the new one
      await loadSubjects();
      
      setName("");
      alert("Subject created successfully!");
    } catch (error) {
      console.error('Error creating subject:', error);
      alert("Failed to create subject. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (subjectId: string, subjectName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${subjectName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setDeleting(subjectId);
      await deleteSubject(subjectId);
      
      // Remove from local state
      setSubjects(subjects.filter(s => s.id !== subjectId));
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert("Failed to delete subject. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Please log in to manage your subjects</h1>
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
        <div className="flex justify-between items-center mb-8 sm:mb-12">
          <div className="text-xl sm:text-2xl font-bold text-white">🧠 QuizGod</div>
          <NavBar />
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">📚 My Subjects</h1>
                <p className="text-purple-200 mt-1">Organize your quiz topics and subjects</p>
              </div>
              <Link 
                href="/create" 
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-lg text-center"
              >
                ➕ Create Quiz
              </Link>
            </div>

            {/* Add Subject Form */}
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg border border-purple-200 dark:border-purple-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">➕ Add New Subject</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 p-3 border border-purple-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                  placeholder="Enter subject name (e.g., Mathematics, History, Science)"
                  onKeyPress={(e) => e.key === 'Enter' && addSubject()}
                />
                <button
                  onClick={addSubject}
                  disabled={creating || !name.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                >
                  {creating ? "Adding..." : "Add Subject"}
                </button>
              </div>
            </div>

            {/* Subjects Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold">{subjects.length}</div>
                <div className="text-sm sm:text-base opacity-90">Total Subjects</div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold">
                  {subjects.filter(s => s.source === 'personal').length}
                </div>
                <div className="text-sm sm:text-base opacity-90">Personal</div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold">
                  {subjects.filter(s => s.source === 'class').length}
                </div>
                <div className="text-sm sm:text-base opacity-90">From Classes</div>
              </div>
            </div>

            {/* Subjects List */}
            {loading ? (
              <div className="text-center p-12">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-purple-200">Loading your subjects...</p>
              </div>
            ) : subjects.length === 0 ? (
              <div className="text-center p-12 border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-lg">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-white mb-2">No subjects yet</h3>
                <p className="text-purple-200 mb-4">Add your first subject to start organizing your quizzes!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {subjects.map((subject) => (
                  <div key={subject.id} className="bg-white dark:bg-gray-700 rounded-xl p-4 sm:p-6 border border-purple-100 dark:border-gray-600 hover:shadow-lg transition-all duration-200 group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {subject.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            subject.source === 'class' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          }`}>
                            {subject.source === 'class' ? `👥 ${subject.className}` : '👤 Personal'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <span className="w-5 h-5 mr-2">📅</span>
                        <span>Created {formatDate(subject.createdAt)}</span>
                      </div>
                      {subject.description && (
                        <div className="flex items-start">
                          <span className="w-5 h-5 mr-2 mt-0.5">📝</span>
                          <span className="line-clamp-2">{subject.description}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Link 
                        href={`/create?subject=${encodeURIComponent(subject.name)}`} 
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-center rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md text-sm font-medium"
                      >
                        ➕ Create Quiz
                      </Link>
                      {subject.source === 'personal' && (
                        <button 
                          onClick={() => handleDelete(subject.id, subject.name)} 
                          disabled={deleting === subject.id}
                          className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md text-sm font-medium disabled:opacity-50"
                          title="Delete subject"
                        >
                          {deleting === subject.id ? "⏳" : "🗑️"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Links */}
            <div className="mt-8 p-4 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/30 dark:to-slate-800/30 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">🔗 Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link 
                  href="/create" 
                  className="flex items-center justify-center p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
                >
                  📝 Create Quiz
                </Link>
                <Link 
                  href="/ai-quiz" 
                  className="flex items-center justify-center p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  🧠 AI Quiz Generator
                </Link>
                <Link 
                  href="/quizzes" 
                  className="flex items-center justify-center p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                >
                  🎮 My Quizzes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}