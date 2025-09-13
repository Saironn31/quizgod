"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { useAuth } from '@/contexts/AuthContext';
import { 
  createClass, 
  joinClass, 
  getUserClasses,
  FirebaseClass,
  migrateLocalDataToFirestore
} from '@/lib/firestore';

export default function ClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<FirebaseClass[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    loadUserClasses();
    migrateExistingData();
  }, [user]);

  const migrateExistingData = async () => {
    if (!user?.uid || !user?.email) return;
    
    try {
      // Check if there's localStorage data to migrate
      const hasLocalData = localStorage.getItem("qg_all_classes") || 
                          localStorage.getItem(`qg_user_classes_${user.email}`);
      
      if (hasLocalData && !localStorage.getItem(`qg_migrated_${user.uid}`)) {
        console.log('Migrating localStorage data to Firebase...');
        await migrateLocalDataToFirestore(user.uid, user.email);
        localStorage.setItem(`qg_migrated_${user.uid}`, 'true');
        // Reload classes after migration
        await loadUserClasses();
      }
    } catch (error) {
      console.error('Migration error:', error);
    }
  };

  const loadUserClasses = async () => {
    if (!user?.email) return;
    
    try {
      setLoading(true);
      const userClasses = await getUserClasses(user.email);
      setClasses(userClasses);
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim() || !user?.uid || !user?.email) {
      alert("Please enter a class name");
      return;
    }

    try {
      setCreating(true);
      const classId = await createClass(
        newClassName.trim(),
        newClassDescription.trim() || undefined,
        user.uid,
        user.email
      );
      
      // Reload classes to show the new one
      await loadUserClasses();
      
      // Reset form
      setNewClassName("");
      setNewClassDescription("");
      setShowCreateForm(false);
      alert("Class created successfully!");
    } catch (error) {
      console.error('Error creating class:', error);
      alert("Failed to create class. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinClass = async () => {
    if (!joinCode.trim() || !user?.uid || !user?.email) {
      alert("Please enter a join code");
      return;
    }

    try {
      setJoining(true);
      const success = await joinClass(joinCode.trim(), user.uid, user.email);
      
      if (success) {
        // Reload classes to show the joined class
        await loadUserClasses();
        setJoinCode("");
        setShowJoinForm(false);
        alert("Successfully joined the class!");
      } else {
        alert("Invalid join code or you're already a member of this class.");
      }
    } catch (error) {
      console.error('Error joining class:', error);
      alert("Failed to join class. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  const getUserRole = (classData: FirebaseClass): 'president' | 'member' => {
    if (!user?.email) return 'member';
    return classData.memberRoles[user.email] || 'member';
  };

  const copyClassCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert("Class code copied to clipboard!");
  };

  // Show loading or auth redirect
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Please log in to access Classes</h1>
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
      
        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">👥 My Classes</h1>
            <p className="text-purple-100 text-lg">
              Create or join classes to collaborate on quizzes and compete with classmates!
            </p>
          </div>
          
          <div className="flex justify-center gap-4 mb-8 flex-wrap">
            <button
              onClick={() => setShowJoinForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:scale-105 font-medium"
            >
              🔗 Join Class
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:scale-105 font-medium"
            >
              ➕ Create Class
            </button>
          </div>

          {/* Create Class Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 w-full max-w-md mx-4">
                <h2 className="text-xl font-bold text-white mb-4">Create New Class</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">Class Name</label>
                    <input
                      type="text"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      className="w-full p-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      placeholder="Enter class name..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">Description (Optional)</label>
                    <textarea
                      value={newClassDescription}
                      onChange={(e) => setNewClassDescription(e.target.value)}
                      className="w-full p-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      placeholder="Enter class description..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateClass}
                      disabled={creating}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50"
                    >
                      {creating ? "Creating..." : "Create"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Join Class Modal */}
          {showJoinForm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 w-full max-w-md mx-4">
                <h2 className="text-xl font-bold text-white mb-4">Join Class</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">Class Code</label>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="w-full p-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      placeholder="Enter class code..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowJoinForm(false)}
                      className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleJoinClass}
                      disabled={joining}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50"
                    >
                      {joining ? "Joining..." : "Join"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Classes List */}
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-purple-200">Loading classes...</p>
              </div>
            ) : classes.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-white mb-2">No classes yet</h3>
                <p className="text-purple-200 mb-6">Create your first class or join an existing one!</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {classes.map((classData) => {
                  const userRole = getUserRole(classData);
                  const isPresident = userRole === 'president';
                  
                  return (
                    <div key={classData.id} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-200">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">{classData.name}</h3>
                          {classData.description && (
                            <p className="text-purple-200 text-sm">{classData.description}</p>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          isPresident 
                            ? 'bg-yellow-500/20 text-yellow-300' 
                            : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {isPresident ? '👑 President' : '👤 Member'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-purple-200 mb-4">
                        <span>👥 {classData.members.length} member{classData.members.length !== 1 ? 's' : ''}</span>
                        <span>📅 {classData.createdAt.toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex gap-2 flex-wrap">
                        <Link
                          href={`/classes/${classData.id}`}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-center rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all text-sm font-medium"
                        >
                          Enter Class
                        </Link>
                        <button
                          onClick={() => copyClassCode(classData.joinCode)}
                          className="px-3 py-2 bg-white/10 text-purple-200 rounded-lg hover:bg-white/20 transition-all text-sm"
                          title="Copy join code"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-12 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-lg font-semibold text-white mb-4">💡 How to use Classes</h2>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-purple-200">
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-300 font-bold">•</span>
                  <span><strong className="text-white">Create classes</strong> and invite students with join codes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-300 font-bold">•</span>
                  <span><strong className="text-white">Join classes</strong> using codes shared by teachers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-300 font-bold">•</span>
                  <span><strong className="text-white">Share subjects</strong> and quizzes within your class</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300 font-bold">•</span>
                  <span><strong className="text-white">Track progress</strong> and see leaderboards</span>
                </li>
              </ul>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-red-300 font-bold">•</span>
                  <span><strong className="text-white">Presidents</strong> can manage class settings and members</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-300 font-bold">•</span>
                  <span><strong className="text-white">Members</strong> can participate in quizzes and discussions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-300 font-bold">•</span>
                  <span><strong className="text-white">Collaborate</strong> on quiz creation and study together</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-300 font-bold">•</span>
                  <span><strong className="text-white">Compete and learn</strong> with your classmates!</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}