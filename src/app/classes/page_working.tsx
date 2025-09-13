"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Class {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  code: string;
  members: string[];
  subjects: any[];
  quizzes: any[];
  createdAt: string;
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
    if (user) {
      const userData = JSON.parse(user);
      setCurrentUser(userData.username);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadClasses();
    }
  }, [currentUser]);

  const loadClasses = () => {
    if (!currentUser) return;

    try {
      const username = currentUser;
      console.log("Loading classes for user:", username);

      const userClasses = localStorage.getItem(`qg_user_classes_${username}`);
      if (userClasses) {
        const classIds = JSON.parse(userClasses);
        const loadedClasses = classIds.map((id: string) => {
          const classData = localStorage.getItem(`qg_class_${id}`);
          if (classData) {
            const parsedClass = JSON.parse(classData);
            
            // Load subjects and quizzes counts
            const classSubjects = JSON.parse(localStorage.getItem(`qg_class_subjects_${id}`) || "[]");
            const classQuizzes = JSON.parse(localStorage.getItem(`qg_class_quizzes_${id}`) || "[]");
            
            return {
              ...parsedClass,
              subjects: classSubjects,
              quizzes: classQuizzes
            };
          }
          return null;
        }).filter(Boolean);

        setClasses(loadedClasses);
      }
    } catch (error) {
      console.error("Error loading classes:", error);
    }
  };

  const generateClassCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const codeLength = 6;
    let result = "";
    for (let i = 0; i < codeLength; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Check if code exists
    const allClasses = JSON.parse(localStorage.getItem("qg_all_classes") || "[]");
    const codeExists = allClasses.some((cls: any) => cls.code === result);
    if (codeExists) {
      return generateClassCode(); // Recursively generate until unique
    }

    return result;
  };

  const createClass = () => {
    if (!currentUser || !newClassName.trim()) return;

    const classId = `class_${Date.now()}`;
    const classCode = generateClassCode();

    const newClass = {
      id: classId,
      name: newClassName.trim(),
      description: newClassDescription.trim(),
      createdBy: currentUser,
      code: classCode,
      members: [currentUser],
      subjects: [],
      quizzes: [],
      createdAt: new Date().toISOString()
    };

    // Save class data
    localStorage.setItem(`qg_class_${classId}`, JSON.stringify(newClass));

    // Update user's class list
    const userClasses = JSON.parse(localStorage.getItem(`qg_user_classes_${currentUser}`) || "[]");
    userClasses.push(classId);
    localStorage.setItem(`qg_user_classes_${currentUser}`, JSON.stringify(userClasses));

    // Update global class list
    const allClasses = JSON.parse(localStorage.getItem("qg_all_classes") || "[]");
    allClasses.push(newClass);
    localStorage.setItem("qg_all_classes", JSON.stringify(allClasses));

    // Set user role as president
    localStorage.setItem(`qg_class_role_${classId}_${currentUser}`, "president");

    setClasses(prev => [...prev, newClass]);
    setNewClassName("");
    setNewClassDescription("");
    setShowCreateForm(false);
  };

  const joinClass = () => {
    if (!currentUser || !joinCode.trim()) return;

    const code = joinCode.trim().toUpperCase();
    
    // Find class by code
    const allClasses = JSON.parse(localStorage.getItem("qg_all_classes") || "[]");
    let targetClass = allClasses.find((cls: any) => cls.code === code);

    if (!targetClass) {
      // If not found in global list, search localStorage keys
      console.log("Class not found in global list, searching...");
      console.log("Searching individual localStorage keys...");
      const allKeys = Object.keys(localStorage);
      
      for (const key of allKeys) {
        if (key.startsWith("qg_class_")) {
          try {
            const classData = JSON.parse(localStorage.getItem(key) || "{}");
            if (classData.code === code) {
              targetClass = classData;
              console.log("Found class:", targetClass);
              break;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    if (!targetClass) {
      alert("Invalid class code!");
      return;
    }

    // Check if user is already a member
    if (targetClass.members.includes(currentUser)) {
      alert("You are already a member of this class!");
      setJoinCode("");
      setShowJoinForm(false);
      return;
    }

    // Add user to class members
    targetClass.members.push(currentUser);

    // Update class data
    localStorage.setItem(`qg_class_${targetClass.id}`, JSON.stringify(targetClass));

    // Add class to user's class list
    const userClasses = JSON.parse(localStorage.getItem(`qg_user_classes_${currentUser}`) || "[]");
    if (!userClasses.includes(targetClass.id)) {
      userClasses.push(targetClass.id);
      localStorage.setItem(`qg_user_classes_${currentUser}`, JSON.stringify(userClasses));
    }

    // Set user role as member
    localStorage.setItem(`qg_class_role_${targetClass.id}_${currentUser}`, "member");

    // Update state
    setClasses(prev => [...prev, targetClass]);
    setJoinCode("");
    setShowJoinForm(false);
  };

  const deleteClass = (classId: string) => {
    if (!currentUser) return;
    
    const confirmDelete = window.confirm("Are you sure you want to delete this class? This action cannot be undone.");
    if (!confirmDelete) return;

    // Remove from user's class list
    const userClasses = JSON.parse(localStorage.getItem(`qg_user_classes_${currentUser}`) || "[]");
    const updatedUserClasses = userClasses.filter((id: string) => id !== classId);
    localStorage.setItem(`qg_user_classes_${currentUser}`, JSON.stringify(updatedUserClasses));

    // Remove class data
    localStorage.removeItem(`qg_class_${classId}`);
    localStorage.removeItem(`qg_class_subjects_${classId}`);
    localStorage.removeItem(`qg_class_quizzes_${classId}`);
    localStorage.removeItem(`qg_class_role_${classId}_${currentUser}`);

    // Update global class list
    const allClasses = JSON.parse(localStorage.getItem("qg_all_classes") || "[]");
    const updatedAllClasses = allClasses.filter((cls: any) => cls.id !== classId);
    localStorage.setItem("qg_all_classes", JSON.stringify(updatedAllClasses));

    // Update state
    setClasses(prev => prev.filter(cls => cls.id !== classId));
  };

  const leaveClass = (classId: string) => {
    if (!currentUser) return;
    
    const confirmLeave = window.confirm("Are you sure you want to leave this class?");
    if (!confirmLeave) return;

    // Get class data
    const classData = localStorage.getItem(`qg_class_${classId}`);
    if (classData) {
      const classObj = JSON.parse(classData);
      
      // Remove user from members
      classObj.members = classObj.members.filter((member: string) => member !== currentUser);
      
      // Update class data
      localStorage.setItem(`qg_class_${classId}`, JSON.stringify(classObj));
    }

    // Remove from user's class list
    const userClasses = JSON.parse(localStorage.getItem(`qg_user_classes_${currentUser}`) || "[]");
    const updatedUserClasses = userClasses.filter((id: string) => id !== classId);
    localStorage.setItem(`qg_user_classes_${currentUser}`, JSON.stringify(updatedUserClasses));

    // Remove user role
    localStorage.removeItem(`qg_class_role_${classId}_${currentUser}`);

    // Update state
    setClasses(prev => prev.filter(cls => cls.id !== classId));
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please log in to view classes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You need to be logged in to create and join classes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Classes
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Create Class
            </button>
            <button
              onClick={() => setShowJoinForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Join Class
            </button>
          </div>
        </div>

        {/* Create Class Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Create New Class
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Class Name
                  </label>
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter class name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newClassDescription}
                    onChange={(e) => setNewClassDescription(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe your class"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={createClass}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    Create Class
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewClassName("");
                      setNewClassDescription("");
                    }}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Join Class Modal */}
        {showJoinForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Join Class
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Class Code
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-center text-lg tracking-wider"
                    placeholder="ENTER CODE"
                    maxLength={6}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={joinClass}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    Join Class
                  </button>
                  <button
                    onClick={() => {
                      setShowJoinForm(false);
                      setJoinCode("");
                    }}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Classes Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((classItem) => {
            const isPresident = classItem.createdBy === currentUser;
            
            return (
              <div key={classItem.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {classItem.name}
                    </h3>
                    {classItem.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                        {classItem.description}
                      </p>
                    )}
                    <div className="mb-3">
                      <div className="text-lg font-mono font-bold text-blue-600">{classItem.code}</div>
                      <div className="text-xs text-gray-500">Class Code</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {isPresident ? "👑 President" : "👥 Member"}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <div className="space-y-1">
                    <span>📚 {classItem.subjects.length} subject{classItem.subjects.length !== 1 ? 's' : ''}</span>
                    <span>📝 {classItem.quizzes.length} quiz{classItem.quizzes.length !== 1 ? 'zes' : ''}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      {classItem.members.length} member{classItem.members.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/classes/${classItem.id}`}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    View Details
                  </Link>
                  {isPresident ? (
                    <button
                      onClick={() => deleteClass(classItem.id)}
                      className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      Delete
                    </button>
                  ) : (
                    <button
                      onClick={() => leaveClass(classItem.id)}
                      className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      Leave
                    </button>
                  )}
                </div>

                <Link
                  href={`/classes/${classItem.id}/leaderboard`}
                  className="block w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white text-center py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  View Leaderboard
                </Link>
              </div>
            );
          })}
        </div>

        {classes.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 text-lg mb-4">
              You haven't joined any classes yet
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Create a new class or join an existing one to get started!
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Create Your First Class
              </button>
              <button
                onClick={() => setShowJoinForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Join a Class
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}