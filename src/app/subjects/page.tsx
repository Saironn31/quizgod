"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import SideNav from '@/components/SideNav';
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
  creatorName?: string;
  creatorUsername?: string;
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
      const extendedSubjects: ExtendedFirebaseSubject[] = await Promise.all(allSubjects.map(async subject => {
        let creatorName, creatorUsername;
        try {
          const res = await import('@/lib/firestore');
          const getUserProfile = res.getUserProfile;
          const creatorProfile = await getUserProfile(subject.userId);
          creatorName = creatorProfile?.name;
          creatorUsername = creatorProfile?.username;
        } catch {}
        if (subject.classId) {
          const parentClass = userClasses.find(c => c.id === subject.classId);
          return {
            ...subject,
            source: 'class' as const,
            className: parentClass?.name || 'Unknown Class',
            creatorName,
            creatorUsername
          };
        } else {
          return {
            ...subject,
            source: 'personal' as const,
            creatorName,
            creatorUsername
          };
        }
      }));
      
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
                  <span className="text-white">Subjects</span>
                </h1>
                <p className="text-slate-300 text-lg">Manage your subjects and organize quizzes</p>
              </div>
              <Link href="/quizzes" className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:scale-105 transition-all duration-300 shadow-glow">
                My Quizzes
              </Link>
            </div>
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="glass-card rounded-3xl p-6 md:col-span-2 animate-slide-up">
            <h3 className="text-xl font-bold text-white mb-4">Your Subjects</h3>

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map((subject) => (
                  <div key={subject.id} className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-lg font-semibold text-gray-800">{subject.name}</h3>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold mb-2 ${
                      subject.source === 'class'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    }`}>
                      {subject.source === 'class' ? `👥 ${subject.className}` : '👤 Personal'}
                    </span>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs text-gray-400">Created by {subject.creatorName ?? subject.creatorUsername ?? subject.userId}</span>
                      <Link 
                        href={`/quizzes?subject=${encodeURIComponent(subject.name)}`}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md text-sm font-medium"
                      >
                        📝 View Quizzes
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

          </div>
          <div className="glass-card rounded-3xl p-6 md:col-span-1 animate-slide-up" style={{animationDelay: '0.1s'}}>
            {/* Quick Links removed */}
          </div>
        </div>
      </div>
    </div>
  );
}