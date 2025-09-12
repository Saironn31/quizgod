"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "../../components/ThemeToggle";

interface Subject {
  id: string;
  name: string;
}

export default function SubjectsPage(){
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [name, setName] = useState("");
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const user = localStorage.getItem("qg_user");
    if (!user) {
      window.location.href = "/";
      return;
    }
    setCurrentUser(user);
  }, []);

  useEffect(()=>{
    if (!currentUser) return;
    
    const storedSubjects = JSON.parse(localStorage.getItem(`qg_subjects_${currentUser}`)||"[]");
    
    // Handle migration from old string array format to new object format
    if (storedSubjects.length > 0 && typeof storedSubjects[0] === 'string') {
      const migratedSubjects = storedSubjects.map((subjectName: string, index: number) => ({
        id: `subject_${Date.now()}_${index}`,
        name: subjectName
      }));
      setSubjects(migratedSubjects);
      localStorage.setItem(`qg_subjects_${currentUser}`, JSON.stringify(migratedSubjects));
    } else {
      setSubjects(storedSubjects);
    }
  },[currentUser]);

  const add = () => {
    if (!name.trim() || !currentUser) return;
    
    // Check if subject with this name already exists
    const subjectExists = subjects.some(subject => subject.name.toLowerCase() === name.toLowerCase());
    if (subjectExists) {
      alert("A subject with this name already exists!");
      return;
    }
    
    const newSubject = {
      id: `subject_${Date.now()}`,
      name: name.trim()
    };
    
    const updatedSubjects = [...subjects, newSubject];
    setSubjects(updatedSubjects);
    localStorage.setItem(`qg_subjects_${currentUser}`, JSON.stringify(updatedSubjects));
    setName("");
  };
  
  const remove = (subjectId: string)=>{
    if (!currentUser) return;
    const updatedSubjects = subjects.filter(subject => subject.id !== subjectId);
    setSubjects(updatedSubjects);
    localStorage.setItem(`qg_subjects_${currentUser}`, JSON.stringify(updatedSubjects));
  };

  if (!currentUser) {
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
            <span className="text-gray-700 dark:text-gray-300">Welcome, {currentUser}!</span>
            <button
              onClick={() => {
                localStorage.removeItem("qg_user");
                window.location.href = "/";
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
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-lg"
              >
                Add Subject
              </button>
            </div>
          </div>

          {/* Subjects List */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">📋 Your Subjects ({subjects.length})</h2>
            {subjects.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400 mb-3">No subjects created yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Add your first subject using the form above</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {subjects.map(subject => (
                  <li key={subject.id} className="flex justify-between items-center bg-white dark:bg-gray-700 rounded-lg p-4 border border-purple-100 dark:border-gray-600 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📖</span>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">{subject.name}</span>
                    </div>
                    <button 
                      onClick={()=>remove(subject.id)} 
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm font-medium"
                    >
                      🗑️ Delete
                    </button>
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
