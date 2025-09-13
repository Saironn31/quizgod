"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from '@/contexts/AuthContext';
import { 
  createClass, 
  joinClass, 
  getUserClasses, 
  subscribeToUserClasses,
  FirebaseClass,
  migrateLocalDataToFirestore,
  clearLocalStorageAfterMigration
} from '@/lib/firestore';

interface ClassMember {
  username: string;
  role: 'president' | 'member';
  joinedAt: string;
}

export default function ClassesPage() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("qg_user");
    if (!user) {
      window.location.href = "/";
      return;
    }
    setCurrentUser(user);
    loadUserClasses(user);

    // Add focus event listener to refresh data when returning to this page
    const handleFocus = () => {
      loadUserClasses(user);
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadUserClasses = (username: string) => {
    const userClasses = localStorage.getItem(`qg_user_classes_${username}`);
    if (userClasses) {
      const classIds = JSON.parse(userClasses);
      const loadedClasses = classIds.map((id: string) => {
        const classData = localStorage.getItem(`qg_class_${id}`);
        if (!classData) return null;
        
        const parsedClass = JSON.parse(classData);
        
        // Dynamically load actual subjects and quizzes counts
        const classSubjects = JSON.parse(localStorage.getItem(`qg_class_subjects_${id}`) || "[]");
        const classQuizzes = JSON.parse(localStorage.getItem(`qg_class_quizzes_${id}`) || "[]");
        
        return {
          ...parsedClass,
          subjects: classSubjects,
          quizzes: classQuizzes
        };
      }).filter(Boolean);
      setClasses(loadedClasses);
      
      // Update global classes list with current data
      updateGlobalClassesList(loadedClasses);
    }
  };

  const updateGlobalClassesList = (updatedClasses: Class[]) => {
    const allClasses = JSON.parse(localStorage.getItem("qg_all_classes") || "[]");
    const updatedAllClasses = allClasses.map((globalClass: Class) => {
      const updatedClass = updatedClasses.find(c => c.id === globalClass.id);
      return updatedClass || globalClass;
    });
    localStorage.setItem("qg_all_classes", JSON.stringify(updatedAllClasses));
  };

  const generateClassCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createClass = () => {
    if (!newClassName.trim() || !currentUser) return;

    const classId = `class_${Date.now()}`;
    const classCode = generateClassCode();
    
    const newClass: Class = {
      id: classId,
      name: newClassName,
      description: newClassDescription,
      code: classCode,
      createdBy: currentUser,
      createdAt: new Date().toISOString(),
      members: [currentUser],
      subjects: [],
      quizzes: []
    };

    // Save class data
    localStorage.setItem(`qg_class_${classId}`, JSON.stringify(newClass));
    
    // Add class to user's class list
    const userClasses = JSON.parse(localStorage.getItem(`qg_user_classes_${currentUser}`) || "[]");
    userClasses.push(classId);
    localStorage.setItem(`qg_user_classes_${currentUser}`, JSON.stringify(userClasses));

    // Add to global class list for easier searching
    const allClasses = JSON.parse(localStorage.getItem("qg_all_classes") || "[]");
    allClasses.push(newClass);
    localStorage.setItem("qg_all_classes", JSON.stringify(allClasses));

    // Save user's role in this class
    localStorage.setItem(`qg_class_role_${classId}_${currentUser}`, "president");

    setClasses([...classes, newClass]);
    setNewClassName("");
    setNewClassDescription("");
    setShowCreateForm(false);
    
    alert(`Class created! Share this code with your classmates: ${classCode}`);
  };

  const joinClass = () => {
    if (!joinCode.trim() || !currentUser) {
      alert("Please enter a valid class code.");
      return;
    }

    console.log("Attempting to join class with code:", joinCode);

    // First try to find class in global class list
    const allClasses = JSON.parse(localStorage.getItem("qg_all_classes") || "[]");
    console.log("All classes in global list:", allClasses);
    
    let targetClass = allClasses.find((classInfo: Class) => classInfo.code === joinCode.toUpperCase());
    console.log("Found in global list:", targetClass);
    
    // If not found in global list, search localStorage keys
    if (!targetClass) {
      console.log("Searching individual localStorage keys...");
      const allKeys = Object.keys(localStorage);
      const classKeys = allKeys.filter(key => key.startsWith('qg_class_'));
      console.log("Class keys found:", classKeys);
      
      for (const key of classKeys) {
        try {
          const classData = JSON.parse(localStorage.getItem(key) || "{}");
          console.log(`Checking class ${key}:`, classData);
          if (classData.code === joinCode.toUpperCase()) {
            targetClass = classData;
            console.log("Found matching class:", targetClass);
            break;
          }
        } catch (error) {
          console.log(`Error parsing ${key}:`, error);
          continue;
        }
      }
    }

    if (!targetClass) {
      alert("Invalid class code! Please check the code and try again.");
      return;
    }

    // Check if already a member
    if (targetClass.members && targetClass.members.includes(currentUser)) {
      alert("You're already a member of this class!");
      return;
    }

    // Add user to class members
    if (!targetClass.members) {
      targetClass.members = [];
    }
    targetClass.members.push(currentUser);
    
    // Save updated class data
    localStorage.setItem(`qg_class_${targetClass.id}`, JSON.stringify(targetClass));

    // Add class to user's class list
    const userClasses = JSON.parse(localStorage.getItem(`qg_user_classes_${currentUser}`) || "[]");
    if (!userClasses.includes(targetClass.id)) {
      userClasses.push(targetClass.id);
      localStorage.setItem(`qg_user_classes_${currentUser}`, JSON.stringify(userClasses));
    }

    // Save user's role in this class
    localStorage.setItem(`qg_class_role_${targetClass.id}_${currentUser}`, "member");

    // Update the global class list
    const updatedAllClasses = JSON.parse(localStorage.getItem("qg_all_classes") || "[]");
    const existingIndex = updatedAllClasses.findIndex((c: Class) => c.id === targetClass.id);
    if (existingIndex >= 0) {
      updatedAllClasses[existingIndex] = targetClass;
    } else {
      updatedAllClasses.push(targetClass);
    }
    localStorage.setItem("qg_all_classes", JSON.stringify(updatedAllClasses));

    setClasses([...classes, targetClass]);
    setJoinCode("");
    setShowJoinForm(false);
    
    alert(`Successfully joined "${targetClass.name}"! 🎉`);
  };

  const leaveClass = (classId: string) => {
    if (!currentUser) return;
    
    if (confirm("Are you sure you want to leave this class?")) {
      // Remove from user's class list
      const userClasses = JSON.parse(localStorage.getItem(`qg_user_classes_${currentUser}`) || "[]");
      const updatedUserClasses = userClasses.filter((id: string) => id !== classId);
      localStorage.setItem(`qg_user_classes_${currentUser}`, JSON.stringify(updatedUserClasses));

      // Remove from class members
      const classData = JSON.parse(localStorage.getItem(`qg_class_${classId}`) || "{}");
      classData.members = classData.members.filter((member: string) => member !== currentUser);
      localStorage.setItem(`qg_class_${classId}`, JSON.stringify(classData));

      // Remove user's role
      localStorage.removeItem(`qg_class_role_${classId}_${currentUser}`);

      setClasses(classes.filter(c => c.id !== classId));
    }
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            🧠 QuizGod
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/create" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              Create Quiz
            </Link>
            <Link href="/ai-quiz" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              🤖 AI Quiz
            </Link>
            <Link href="/subjects" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              Subjects
            </Link>
            <Link href="/quizzes" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              My Quizzes
            </Link>
            <Link href="/classes" className="text-blue-600 dark:text-blue-400 font-semibold">
              👥 Classes
            </Link>
            <span className="text-gray-700 dark:text-gray-200">Welcome, {currentUser}!</span>
            <button
              onClick={() => {
                localStorage.removeItem("qg_user");
                window.location.href = "/";
              }}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">👥 My Classes</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Create or join classes to collaborate on quizzes and compete with classmates!
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowJoinForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 transition-colors"
            >
              🔗 Join Class
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
            >
              ➕ Create Class
            </button>
          </div>
        </div>

        {/* Create Class Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-2xl font-bold mb-4">Create New Class</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="e.g., Math Class 2025"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newClassDescription}
                    onChange={(e) => setNewClassDescription(e.target.value)}
                    placeholder="Brief description of the class..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createClass}
                    disabled={!newClassName.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Class
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Join Class Modal */}
        {showJoinForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-2xl font-bold mb-4">Join Class</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class Code *
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-character code"
                    maxLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center text-lg"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Ask your class president for the class code
                  </p>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowJoinForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={joinClass}
                    disabled={joinCode.length !== 6}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Join Class
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Classes Grid */}
        {classes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎓</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Classes Yet</h3>
            <p className="text-gray-500 mb-6">
              Create a new class or join an existing one to get started!
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                ➕ Create Your First Class
              </button>
              <button
                onClick={() => setShowJoinForm(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                🔗 Join a Class
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem) => {
              const isPresident = classItem.createdBy === currentUser;
              const memberCount = classItem.members.length;
              
              return (
                <div key={classItem.id} className="bg-white rounded-lg shadow-md p-6 border">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{classItem.name}</h3>
                      <p className="text-sm text-gray-500">
                        {isPresident ? '👑 President' : '👤 Member'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-mono font-bold text-blue-600">{classItem.code}</div>
                      <div className="text-xs text-gray-500">Class Code</div>
                    </div>
                  </div>

                  {classItem.description && (
                    <p className="text-gray-600 mb-4 text-sm">{classItem.description}</p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>👥 {memberCount} member{memberCount !== 1 ? 's' : ''}</span>
                    <span>📚 {classItem.subjects.length} subject{classItem.subjects.length !== 1 ? 's' : ''}</span>
                    <span>📝 {classItem.quizzes.length} quiz{classItem.quizzes.length !== 1 ? 'zes' : ''}</span>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/classes/${classItem.id}`}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      📚 Enter Class
                    </Link>
                    <Link
                      href={`/classes/${classItem.id}/leaderboard`}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors text-sm"
                    >
                      🏆
                    </Link>
                    {!isPresident && (
                      <button
                        onClick={() => leaveClass(classItem.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
                      >
                        🚪
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">🌟 How Classes Work:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <ul className="space-y-2">
              <li>• <strong>Create a class</strong> and get a unique 6-character code</li>
              <li>• <strong>Share the code</strong> with your classmates</li>
              <li>• <strong>Collaborate on subjects</strong> - everyone can add/edit</li>
              <li>• <strong>Share quizzes</strong> - contribute and play together</li>
            </ul>
            <ul className="space-y-2">
              <li>• <strong>Class President</strong> can manage class settings</li>
              <li>• <strong>Leaderboards</strong> track scores and completion times</li>
              <li>• <strong>Real-time collaboration</strong> on educational content</li>
              <li>• <strong>Compete and learn</strong> with your classmates!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
