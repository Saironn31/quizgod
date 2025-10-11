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
              <Link href="/quizzes" className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:scale-105 transition-all duration-300 shadow-glow">
                My Quizzes
              </Link>
            </div>
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="glass-card rounded-3xl p-6 md:col-span-2 animate-slide-up">
            <h3 className="text-xl font-bold text-white mb-4">Your Classes</h3>
            {/* ...existing classes list and management UI... */}
          </div>
          <div className="glass-card rounded-3xl p-6 md:col-span-1 animate-slide-up" style={{animationDelay: '0.1s'}}>
            <h3 className="text-xl font-bold text-white mb-4">Quick Links</h3>
            <div className="space-y-3">
              <Link href="/quizzes" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">📝</div>
                <span className="font-semibold text-slate-200 group-hover:text-white transition-colors">My Quizzes</span>
              </Link>
              <Link href="/create" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">➕</div>
                <span className="font-semibold text-slate-200 group-hover:text-white transition-colors">Create Quiz</span>
              </Link>
              <Link href="/subjects" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">📚</div>
                <span className="font-semibold text-slate-200 group-hover:text-white transition-colors">Subjects</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}