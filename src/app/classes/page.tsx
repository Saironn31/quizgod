"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import SideNav from '@/components/SideNav';
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
        user.uid,
        user.email,
        newClassDescription.trim() || undefined
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
      const success = await joinClass(joinCode.trim().toUpperCase(), user.uid, user.email);
      
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
      if (error instanceof Error) {
        alert(`Failed to join class: ${error.message}`);
      } else {
        alert("Failed to join class. Please try again.");
      }
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
            <span className="gradient-text">Classes</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-2xl mx-auto">
            Please log in to view your classes
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
                  <span className="text-white">My Classes</span>
                </h1>
                <p className="text-slate-300 text-lg">Manage and join your classes</p>
              </div>
            </div>
          </div>
        </div>
        {/* Join Class Section */}
        <div className="relative z-10 mb-6">
          <div className="glass-card rounded-xl p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/30">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🔑</div>
                <div>
                  <h3 className="text-lg font-bold text-white">Join Class with Code</h3>
                  <p className="text-sm text-purple-200">Enter a class invite code to join</p>
                </div>
              </div>
              <button
                onClick={() => setShowJoinForm(!showJoinForm)}
                className="px-5 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-all font-medium"
              >
                {showJoinForm ? '✕ Cancel' : '➕ Join Class'}
              </button>
            </div>
            {showJoinForm && (
              <div className="mt-4 pt-4 border-t border-blue-400/20">
                <div className="flex gap-3 flex-wrap">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter invite code (e.g., ABC123)"
                    className="flex-1 min-w-[200px] px-4 py-2 bg-white/10 border border-blue-400/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    onClick={handleJoinClass}
                    disabled={joining || !joinCode.trim()}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {joining ? '⏳ Joining...' : '🚀 Join Class'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
          <div className="glass-card rounded-3xl p-6 md:col-span-2 animate-slide-up">
            <h3 className="text-xl font-bold text-white mb-4">Your Classes</h3>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mb-4"></div>
                <p className="text-slate-300 text-lg font-medium">Loading classes...</p>
              </div>
            ) : classes.length === 0 ? (
              <div className="text-center text-slate-400 py-8 border-2 border-dashed border-slate-700 rounded-2xl">
                <p className="mb-2">No classes yet.</p>
                <p className="text-sm">Create or join a class to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {classes.map(cls => (
                  <Link
                    key={cls.id}
                    href={`/classes/${cls.id}`}
                    className="block bg-gradient-to-br from-cyan-900/30 to-violet-900/30 hover:from-cyan-800/50 hover:to-violet-800/50 border border-white/10 rounded-2xl p-6 transition-all duration-200 shadow-lg hover:scale-[1.03]"
                  >
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 via-violet-500 to-pink-500 flex items-center justify-center text-white text-2xl font-black shadow-glow">
                        {cls.name?.[0]?.toUpperCase() || 'C'}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white mb-1 truncate">{cls.name}</h4>
                        <p className="text-xs text-slate-300 truncate">{cls.description || 'No description'}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-slate-400">{cls.members?.length || 1} member{(cls.members?.length || 1) !== 1 ? 's' : ''}</span>
                      <span className="text-xs text-slate-500">{cls.isPublic ? 'Public' : 'Private'}</span>
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