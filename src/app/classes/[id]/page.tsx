"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Class {
  id: string;
  name: string;
  description: string;
  code: string;
  createdBy: string;
  createdAt: string;
  members: string[];
  subjects: string[];
  quizzes: string[];
}

interface Subject {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
}

interface Quiz {
  title: string;
  subject: string;
  description?: string;
  questions: { question: string; options: string[]; correct: number }[];
  createdBy?: string;
  createdAt?: string;
}

export default function ClassDetailPage() {
  const params = useParams();
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [classData, setClassData] = useState<Class | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [quizzes, setQuizzes] = useState<{ key: string; quiz: Quiz }[]>([]);
  const [members, setMembers] = useState<string[]>([]);
  const [isPresident, setIsPresident] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'quizzes' | 'members'>('overview');
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("qg_user");
    if (!user) {
      window.location.href = "/";
      return;
    }
    setCurrentUser(user);
    loadClassData(params.id as string, user);
  }, [params.id]);

  const loadClassData = (classId: string, username: string) => {
    const classInfo = localStorage.getItem(`qg_class_${classId}`);
    if (!classInfo) {
      alert("Class not found!");
      window.location.href = "/classes";
      return;
    }

    const parsedClass = JSON.parse(classInfo);
    setClassData(parsedClass);
    setMembers(parsedClass.members);
    setIsPresident(parsedClass.createdBy === username);

    // Load class subjects
    loadClassSubjects(classId);
    
    // Load class quizzes
    loadClassQuizzes(classId);
  };

  const loadClassSubjects = (classId: string) => {
    const classSubjects = localStorage.getItem(`qg_class_subjects_${classId}`);
    if (classSubjects) {
      setSubjects(JSON.parse(classSubjects));
    }
  };

  const loadClassQuizzes = (classId: string) => {
    const classQuizzes = localStorage.getItem(`qg_class_quizzes_${classId}`);
    if (classQuizzes) {
      const quizKeys = JSON.parse(classQuizzes);
      const loadedQuizzes = quizKeys.map((key: string) => {
        const quizData = localStorage.getItem(key);
        return quizData ? { key, quiz: JSON.parse(quizData) } : null;
      }).filter(Boolean);
      setQuizzes(loadedQuizzes);
    }
  };

  const addSubject = () => {
    if (!newSubjectName.trim() || !currentUser || !classData) return;

    const subjectId = `subject_${Date.now()}`;
    const newSubject: Subject = {
      id: subjectId,
      name: newSubjectName,
      createdBy: currentUser,
      createdAt: new Date().toISOString()
    };

    const updatedSubjects = [...subjects, newSubject];
    setSubjects(updatedSubjects);
    
    // Save to class subjects
    localStorage.setItem(`qg_class_subjects_${classData.id}`, JSON.stringify(updatedSubjects));
    
    // Also add to each member's personal subjects
    members.forEach(member => {
      const memberSubjects = JSON.parse(localStorage.getItem(`qg_subjects_${member}`) || "[]");
      const subjectExists = memberSubjects.some((s: Subject) => s.name === newSubjectName);
      if (!subjectExists) {
        memberSubjects.push(newSubject);
        localStorage.setItem(`qg_subjects_${member}`, JSON.stringify(memberSubjects));
      }
    });

    setNewSubjectName("");
    setShowAddSubject(false);
  };

  const deleteSubject = (subjectId: string) => {
    if (!currentUser || !classData) return;
    
    if (confirm("Are you sure you want to delete this subject?")) {
      const updatedSubjects = subjects.filter(s => s.id !== subjectId);
      setSubjects(updatedSubjects);
      localStorage.setItem(`qg_class_subjects_${classData.id}`, JSON.stringify(updatedSubjects));
    }
  };

  const shareQuizToClass = (quizKey: string) => {
    if (!classData) return;

    const classQuizzes = JSON.parse(localStorage.getItem(`qg_class_quizzes_${classData.id}`) || "[]");
    if (!classQuizzes.includes(quizKey)) {
      classQuizzes.push(quizKey);
      localStorage.setItem(`qg_class_quizzes_${classData.id}`, JSON.stringify(classQuizzes));
      loadClassQuizzes(classData.id);
      alert("Quiz shared with class!");
    } else {
      alert("Quiz is already shared with this class!");
    }
  };

  const copyClassCode = () => {
    if (classData) {
      navigator.clipboard.writeText(classData.code);
      alert("Class code copied to clipboard!");
    }
  };

  if (!currentUser || !classData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            🧠 QuizGod
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/classes" className="text-gray-600 hover:text-blue-600">
              ← Back to Classes
            </Link>
            <span className="text-gray-700">Welcome, {currentUser}!</span>
          </div>
        </div>
      </nav>

      {/* Class Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">{classData.name}</h1>
              <p className="text-blue-100 mt-2">{classData.description}</p>
              <div className="flex items-center gap-4 mt-4">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                  👥 {members.length} member{members.length !== 1 ? 's' : ''}
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                  📚 {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                  📝 {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-2xl font-mono font-bold">{classData.code}</div>
                <button 
                  onClick={copyClassCode}
                  className="text-sm text-blue-200 hover:text-white mt-1"
                >
                  📋 Copy Code
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: '📊 Overview', icon: '📊' },
              { id: 'subjects', label: '📚 Subjects', icon: '📚' },
              { id: 'quizzes', label: '📝 Quizzes', icon: '📝' },
              { id: 'members', label: '👥 Members', icon: '👥' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl mb-2">👥</div>
                <div className="text-2xl font-bold text-gray-800">{members.length}</div>
                <div className="text-gray-600">Active Members</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl mb-2">📚</div>
                <div className="text-2xl font-bold text-gray-800">{subjects.length}</div>
                <div className="text-gray-600">Subjects</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl mb-2">📝</div>
                <div className="text-2xl font-bold text-gray-800">{quizzes.length}</div>
                <div className="text-gray-600">Shared Quizzes</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">🎯 Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    href="/create"
                    className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
                  >
                    ➕ Create New Quiz
                  </Link>
                  <Link
                    href="/ai-quiz"
                    className="block w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-center"
                  >
                    🤖 Generate AI Quiz
                  </Link>
                  <Link
                    href={`/classes/${classData.id}/leaderboard`}
                    className="block w-full px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-center"
                  >
                    🏆 View Leaderboard
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">📈 Class Activity</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Class created</span>
                    <span className="text-gray-500">
                      {new Date(classData.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Total subjects</span>
                    <span className="text-blue-600 font-semibold">{subjects.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Total quizzes</span>
                    <span className="text-purple-600 font-semibold">{quizzes.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span>Members joined</span>
                    <span className="text-green-600 font-semibold">{members.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">📚 Class Subjects</h2>
              <button
                onClick={() => setShowAddSubject(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                ➕ Add Subject
              </button>
            </div>

            {showAddSubject && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Add New Subject</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="Subject name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={addSubject}
                    disabled={!newSubjectName.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowAddSubject(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {subjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Subjects Yet</h3>
                <p className="text-gray-500 mb-4">Add subjects to organize your class quizzes!</p>
                <button
                  onClick={() => setShowAddSubject(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ➕ Add First Subject
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map((subject) => (
                  <div key={subject.id} className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-lg font-semibold text-gray-800">{subject.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Created by {subject.createdBy}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(subject.createdAt).toLocaleDateString()}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => deleteSubject(subject.id)}
                        className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'quizzes' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">📝 Class Quizzes</h2>
              <div className="flex gap-3">
                <Link
                  href="/create"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ➕ Create Quiz
                </Link>
                <Link
                  href="/ai-quiz"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  🤖 AI Quiz
                </Link>
              </div>
            </div>

            {quizzes.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Shared Quizzes Yet</h3>
                <p className="text-gray-500 mb-4">Create quizzes and share them with your class!</p>
                <div className="flex gap-4 justify-center">
                  <Link
                    href="/create"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    ➕ Create Quiz
                  </Link>
                  <Link
                    href="/ai-quiz"
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    🤖 Generate AI Quiz
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quizzes.map(({ key, quiz }) => (
                  <div key={key} className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-xl font-semibold text-gray-800">{quiz.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">Subject: {quiz.subject}</p>
                    {quiz.description && (
                      <p className="text-sm text-gray-600 mt-2">{quiz.description}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      Questions: {quiz.questions.length}
                    </p>
                    {quiz.createdBy && (
                      <p className="text-xs text-gray-400 mt-1">
                        Created by {quiz.createdBy}
                      </p>
                    )}
                    <div className="mt-4 flex gap-2">
                      <Link
                        href={`/quizzes/${key}`}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                      >
                        🎮 Play Quiz
                      </Link>
                      <Link
                        href={`/classes/${classData.id}/leaderboard?quiz=${key}`}
                        className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm"
                      >
                        🏆 Scores
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">👥 Class Members</h2>
              <div className="text-sm text-gray-600">
                {members.length} member{members.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <div key={member} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                      {member[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{member}</h3>
                      <p className="text-sm text-gray-500">
                        {member === classData.createdBy ? '👑 President' : '👤 Member'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
