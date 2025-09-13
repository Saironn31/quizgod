"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "../../components/ThemeToggle";
import { useAuth } from '@/contexts/AuthContext';
import { createSubject, getUserSubjects, deleteSubject, FirebaseSubject } from '@/lib/firestore';

interface ClassInfo {
  id: string;
  name: string;
  members: string[];
}

interface ExtendedFirebaseSubject extends FirebaseSubject {
  source?: 'personal' | 'class';
  className?: string;
}

export default function SubjectsPage(){
  const [subjects, setSubjects] = useState<ExtendedFirebaseSubject[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();

  // Load subjects from Firestore and classes
  useEffect(() => {
    if (!user) return;
    
    // Initialize user mapping if it doesn't exist
    const initializeUserMapping = () => {
      if (!user.email) return;
      
      // Create a mapping from the email username to full email for backward compatibility
      const emailUsername = user.email.split('@')[0];
      const userMapping = {
        email: user.email,
        username: emailUsername,
        created: new Date().toISOString()
      };
      
      // Store user data
      localStorage.setItem(`qg_user_data_${user.email}`, JSON.stringify(userMapping));
      
      // For your specific case, create a mapping for "Sairon" -> your email
      // This should ideally be done through a proper user profile system
      if (user.email === 'johnvaldivieso331@gmail.com') {
        localStorage.setItem(`qg_username_Sairon`, JSON.stringify({
          email: user.email,
          created: new Date().toISOString()
        }));
      }
    };
    
    const loadSubjects = async () => {
      try {
        setLoading(true);
        
        // Load personal subjects from Firebase
        const userSubjects = await getUserSubjects(user.uid);
        
        // Load class subjects from ALL available classes (both created and joined)
        const allClasses = JSON.parse(localStorage.getItem("qg_all_classes") || "[]");
        
        // Extract unique subjects from classes where user is a member (includes both created and joined classes)
        const classSubjects: ExtendedFirebaseSubject[] = [];
        const seenSubjects = new Set(userSubjects.map(s => s.name.toLowerCase()));
        
        // Load subjects from ALL classes (created by user OR joined by user)
        for (const classInfo of allClasses as ClassInfo[]) {
          // Include subjects from all classes where user is a member (creator or joiner)
          // Note: When you create a class, you're automatically in the members array
          // When you join a class, you're also added to the members array
          
          // Get user identifier - check both email and any stored username mapping
          const userEmail = user.email;
          if (!userEmail) {
            continue;
          }
          
          const emailUsername = userEmail.split('@')[0]; // johnvaldivieso331 from johnvaldivieso331@gmail.com
          
          // Check if user has a stored username mapping
          const storedUserData = localStorage.getItem(`qg_user_data_${userEmail}`);
          let userIdentifiers = [userEmail, emailUsername];
          
          if (storedUserData) {
            try {
              const userData = JSON.parse(storedUserData);
              if (userData.username) {
                userIdentifiers.push(userData.username);
              }
            } catch (e) {
              console.warn('Failed to parse user data:', e);
            }
          }
          
          // Also check if there's a reverse mapping (username -> email)
          const allUsernames = ['Sairon']; // Add other known usernames as needed
          for (const username of allUsernames) {
            const usernameData = localStorage.getItem(`qg_username_${username}`);
            if (usernameData) {
              try {
                const data = JSON.parse(usernameData);
                if (data.email === userEmail) {
                  userIdentifiers.push(username);
                }
              } catch (e) {
                // Continue checking
              }
            }
          }
          
          const isUserInClass = classInfo.members && classInfo.members.some(member => {
            const memberStr = String(member).trim();
            return userIdentifiers.some(identifier => 
              String(identifier).trim().toLowerCase() === memberStr.toLowerCase()
            );
          });
          
          // Also check if user has access to this class's subjects (alternative approach)
          const userClasses = JSON.parse(localStorage.getItem(`qg_user_classes_${userEmail}`) || "[]");
          const hasAccessToClass = isUserInClass || userClasses.includes(classInfo.id);
          
          if (hasAccessToClass) {
            const classSubjectsData = JSON.parse(localStorage.getItem(`qg_class_subjects_${classInfo.id}`) || "[]");
            classSubjectsData.forEach((subject: any) => {
              if (!seenSubjects.has(subject.name.toLowerCase())) {
                classSubjects.push({
                  id: `class-${classInfo.id}-${subject.name}`,
                  name: subject.name,
                  userId: user.uid,
                  createdAt: new Date(subject.createdAt || Date.now()),
                  source: 'class',
                  className: classInfo.name
                } as ExtendedFirebaseSubject);
                seenSubjects.add(subject.name.toLowerCase());
              }
            });
          }
        }
        
        // Combine personal and class subjects (mark personal ones)
        const personalSubjects = userSubjects.map(s => ({ ...s, source: 'personal' as const }));
        const allSubjects = [...personalSubjects, ...classSubjects];
        setSubjects(allSubjects);
      } catch (error) {
        console.error('Error loading subjects:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeUserMapping();
    loadSubjects();
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
      const newSubject: FirebaseSubject = {
        id: subjectId,
        name: name.trim(),
        userId: user.uid,
        createdAt: new Date()
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
