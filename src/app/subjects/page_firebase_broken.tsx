"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "../../components/ThemeToggle";
import { useAuth } from '@/contexts/AuthContext';
import { 
  createSubject, 
  getUserSubjects, 
  deleteSubject, 
  FirebaseSubject,
  getUserClasses,
  FirebaseClass,
  migrateLocalDataToFirestore
} from '@/lib/firestore';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ExtendedFirebaseSubject extends FirebaseSubject {
  source?: 'personal' | 'class';
  className?: string;
}

export default function SubjectsPage(){
  const [subjects, setSubjects] = useState<ExtendedFirebaseSubject[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const { user } = useAuth();

  // Load subjects from Firebase
  useEffect(() => {
    if (!user) return;
    
    let unsubscribes: (() => void)[] = [];
    
    const loadSubjects = async () => {
      try {
        setLoading(true);
        
        // Check if migration is needed
        const hasLocalData = localStorage.getItem("qg_all_classes") || 
                           localStorage.getItem(`qg_user_classes_${user.email}`) ||
                           localStorage.getItem("qg_personal_subjects");
        
        if (hasLocalData && !localStorage.getItem(`qg_migrated_${user.uid}`)) {
          setMigrating(true);
          try {
            await migrateLocalDataToFirestore(user.uid, user.email || '');
            localStorage.setItem(`qg_migrated_${user.uid}`, 'true');
          } catch (error) {
            console.warn('Migration failed, continuing with Firebase data:', error);
          }
          setMigrating(false);
        }
        
        // Load personal subjects with real-time updates
        const personalSubjectsQuery = query(
          collection(db, 'subjects'),
          where('userId', '==', user.uid)
        );
        
        const unsubPersonal = onSnapshot(personalSubjectsQuery, (snapshot) => {
          const personalSubjects: ExtendedFirebaseSubject[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            source: 'personal' as const
          } as ExtendedFirebaseSubject));
          
          // Load class subjects
          loadClassSubjects(personalSubjects);
        });
        
        unsubscribes.push(unsubPersonal);
        
      } catch (error) {
        console.error('Error loading subjects:', error);
        setLoading(false);
      }
    };
    
    const loadClassSubjects = async (personalSubjects: ExtendedFirebaseSubject[]) => {
      try {
        // Get user's classes (both created and joined)
        const userClasses = await getUserClasses(user.uid);
        
        const classSubjects: ExtendedFirebaseSubject[] = [];
        const seenSubjects = new Set(personalSubjects.map(s => s.name.toLowerCase()));
        
        // Load subjects from each class
        for (const classData of userClasses) {
          const classSubjectsQuery = query(
            collection(db, 'subjects'),
            where('classId', '==', classData.id)
          );
          
          const snapshot = await getDocs(classSubjectsQuery);
          
          snapshot.docs.forEach(doc => {
            const subjectData = doc.data() as FirebaseSubject;
            if (!seenSubjects.has(subjectData.name.toLowerCase())) {
              classSubjects.push({
                ...subjectData,
                id: doc.id,
                source: 'class',
                className: classData.name
              } as ExtendedFirebaseSubject);
              seenSubjects.add(subjectData.name.toLowerCase());
            }
          });
        }
        
        // Combine personal and class subjects
        const allSubjects = [...personalSubjects, ...classSubjects];
        setSubjects(allSubjects);
        
      } catch (error) {
        console.error('Error loading class subjects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
    
    // Cleanup subscriptions
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [user]);

  const add = async () => {
    if (!name.trim() || !user) return;
    
    // Check if subject with this name already exists
    const subjectExists = subjects.some(subject => subject.name.toLowerCase() === name.toLowerCase());
    if (subjectExists) {
      alert("A subject with this name already exists!");
      return;
    }
    
    try {
      setCreating(true);
      const subjectId = await createSubject(name.trim(), user.uid);
      const newSubject: ExtendedFirebaseSubject = {
        id: subjectId,
        name: name.trim(),
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPersonal: true,
        source: 'personal'
      };
      setSubjects([...subjects, newSubject]);
      setName("");
    } catch (error) {
      console.error('Error creating subject:', error);
      alert('Failed to create subject. Please try again.');
    } finally {
      setCreating(false);
    }
  };
  
  const remove = async (subjectId: string) => {
    if (!user) return;
    
    try {
      await deleteSubject(subjectId);
      setSubjects(subjects.filter(subject => subject.id !== subjectId));
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert('Failed to delete subject. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Please log in to access Subjects</h1>
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
            <Link href="/subjects" className="text-purple-600 dark:text-purple-400 font-semibold">
              Subjects
            </Link>
            <Link href="/quizzes" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400">
              My Quizzes
            </Link>
            <Link href="/classes" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400">
              Classes
            </Link>
            <Link href="/ai-quiz" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400">
              Smart Quiz
            </Link>
            <ThemeToggle />
            <span className="text-gray-700 dark:text-gray-300">Welcome, {user.email}!</span>
            <button
              onClick={async () => {
                try {
                  // Import logout from AuthContext if needed
                  window.location.href = "/";
                } catch (error) {
                  console.error('Error logging out:', error);
                }
              }}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-gray-700 p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">📚 My Subjects</h1>
            {migrating && (
              <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-2 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800 dark:border-blue-200"></div>
                <span className="text-sm">Migrating data...</span>
              </div>
            )}
          </div>

          {/* Add Subject Form */}
          <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg border border-purple-200 dark:border-purple-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">➕ Add New Subject</h2>
            <div className="flex gap-3">
              <input 
                className="flex-1 p-3 border border-purple-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400" 
                placeholder="Enter subject name..." 
                value={name} 
                onChange={e=>setName(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && add()}
              />
              <button 
                onClick={add} 
                disabled={creating}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-lg disabled:opacity-50"
              >
                {creating ? 'Adding...' : 'Add Subject'}
              </button>
            </div>
          </div>

          {/* Subjects List */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">📋 Your Subjects ({subjects.length})</h2>
            
            {loading ? (
              <div className="text-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading subjects...</p>
              </div>
            ) : subjects.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400 mb-3">No subjects created yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Add your first subject using the form above</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {subjects.map(subject => (
                  <li key={subject.id} className="flex justify-between items-center bg-white dark:bg-gray-700 rounded-lg p-4 border border-purple-100 dark:border-gray-600 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📖</span>
                      <div className="flex flex-col">
                        <span className="text-gray-800 dark:text-gray-200 font-medium">
                          {subject.source === 'class' ? `${subject.name} (${subject.className})` : subject.name}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium w-fit ${
                          subject.source === 'class' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        }`}>
                          {subject.source === 'class' ? '👥 Class Subject' : '👤 Personal'}
                        </span>
                      </div>
                    </div>
                    {subject.source === 'personal' && (
                      <button 
                        onClick={()=>remove(subject.id)} 
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm font-medium"
                      >
                        🗑️ Delete
                      </button>
                    )}
                    {subject.source === 'class' && (
                      <span className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed">
                        Class Subject
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}