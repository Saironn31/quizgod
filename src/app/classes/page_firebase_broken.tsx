"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from '@/contexts/AuthContext';
import { 
  createClass, 
  joinClass, 
  getUserClasses, 
  subscribeToUserClasses,
  getClassSubjects,
  getClassQuizzes,
  FirebaseClass,
  migrateLocalDataToFirestore,
  clearLocalStorageAfterMigration
} from '@/lib/firestore';

interface ClassWithCounts extends FirebaseClass {
  subjectCount: number;
  quizCount: number;
}

export default function ClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassWithCounts[]>([]);
  const [className, setClassName] = useState("");
  const [classDescription, setClassDescription] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [migrated, setMigrated] = useState(false);

  // Check if user needs data migration
  useEffect(() => {
    if (!user?.email) return;
    
    const checkMigration = async () => {
      const hasLocalData = localStorage.getItem('qg_all_classes') !== null;
      if (hasLocalData && !migrated) {
        try {
          console.log('Migrating localStorage data to Firebase...');
          await migrateLocalDataToFirestore(user.uid, user.email!);
          clearLocalStorageAfterMigration();
          setMigrated(true);
        } catch (error) {
          console.error('Migration failed:', error);
        }
      }
    };
    
    checkMigration();
  }, [user, migrated]);

  // Load user's classes from Firebase with counts
  useEffect(() => {
    if (!user?.email) return;

    const loadClassesWithCounts = async (firebaseClasses: FirebaseClass[]) => {
      const classesWithCounts = await Promise.all(
        firebaseClasses.map(async (classInfo) => {
          const subjects = await getClassSubjects(classInfo.id);
          const quizzes = await getClassQuizzes(classInfo.id);
          return {
            ...classInfo,
            subjectCount: subjects.length,
            quizCount: quizzes.length
          };
        })
      );
      setClasses(classesWithCounts);
      setLoading(false);
    };

    // Initial load
    getUserClasses(user.email!).then(loadClassesWithCounts);

    // Set up real-time listener
    const unsubscribe = subscribeToUserClasses(user.email!, loadClassesWithCounts);

    return () => unsubscribe();
  }, [user]);

  const handleCreateClass = async () => {
    if (!className.trim() || !user) return;
    
    try {
      setCreating(true);
      await createClass(
        className.trim(),
        user.uid,
        user.email!,
        classDescription.trim() || undefined
      );
      
      setClassName("");
      setClassDescription("");
      setShowCreateForm(false);
      
      // Classes will be updated via real-time listener
    } catch (error) {
      console.error('Error creating class:', error);
      alert('Failed to create class. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinClass = async () => {
    if (!joinCode.trim() || !user) return;

    try {
      setJoining(true);
      await joinClass(joinCode.trim().toUpperCase(), user.uid, user.email!);
      
      setJoinCode("");
      setShowJoinForm(false);
      
      // Classes will be updated via real-time listener
    } catch (error) {
      console.error('Error joining class:', error);
      alert(error instanceof Error ? error.message : 'Failed to join class. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Please log in to access Classes</h1>
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
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            🧠 QuizGod
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/create" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400">
              Create Quiz
            </Link>
            <Link href="/subjects" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400">
              Subjects
            </Link>
            <Link href="/quizzes" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400">
              My Quizzes
            </Link>
            <Link href="/classes" className="text-purple-600 dark:text-purple-400 font-semibold">
              Classes
            </Link>
            <Link href="/ai-quiz" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400">
              Smart Quiz
            </Link>
            <span className="text-gray-700 dark:text-gray-300">Welcome, {user.email}!</span>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center">
            👥 My Classes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Create or join classes to collaborate with others!</p>
        </div>

        {/* Action Buttons */}
        <div className="mb-8 flex flex-wrap gap-4">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium flex items-center gap-2"
          >
            ➕ Create New Class
          </button>
          <button
            onClick={() => setShowJoinForm(!showJoinForm)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium flex items-center gap-2"
          >
            🔗 Join Class
          </button>
        </div>

        {/* Create Class Form */}
        {showCreateForm && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 border border-purple-100 dark:border-gray-700 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">➕ Create New Class</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Class Name *
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Enter class name..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={classDescription}
                  onChange={(e) => setClassDescription(e.target.value)}
                  placeholder="Enter class description..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCreateClass}
                  disabled={!className.trim() || creating}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors duration-200 font-medium"
                >
                  {creating ? 'Creating...' : 'Create Class'}
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Join Class Form */}
        {showJoinForm && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 border border-green-100 dark:border-gray-700 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">🔗 Join Class</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Join Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character join code..."
                  maxLength={6}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-lg"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleJoinClass}
                  disabled={joinCode.length !== 6 || joining}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors duration-200 font-medium"
                >
                  {joining ? 'Joining...' : 'Join Class'}
                </button>
                <button
                  onClick={() => setShowJoinForm(false)}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Classes List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-purple-100 dark:border-gray-700">
          <div className="p-6 border-b border-purple-100 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center">
              📚 Your Classes ({classes.length})
            </h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center p-8">
                <p className="text-gray-500 dark:text-gray-400">Loading classes...</p>
              </div>
            ) : classes.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400 mb-3">No classes yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Create a new class or join an existing one using the buttons above</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map(classInfo => (
                  <Link 
                    key={classInfo.id}
                    href={`/classes/${classInfo.id}`}
                    className="block bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-6 border border-purple-100 dark:border-gray-600 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">{classInfo.name}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        classInfo.memberRoles[user.email!] === 'president' 
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' 
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      }`}>
                        {classInfo.memberRoles[user.email!] === 'president' ? '👑 President' : '👤 Member'}
                      </span>
                    </div>
                    
                    {classInfo.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">{classInfo.description}</p>
                    )}
                    
                    <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <span>📖 {classInfo.subjectCount} subjects</span>
                      <span>📝 {classInfo.quizCount} quizzes</span>
                      <span>👥 {classInfo.members.length} members</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        Code: <span className="font-mono font-bold">{classInfo.joinCode}</span>
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(classInfo.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}