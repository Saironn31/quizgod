"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { useAuth } from '@/contexts/AuthContext';
import { 
  getClassById, 
  getClassSubjects, 
  getClassQuizzes,
  createSubject,
  FirebaseClass,
  FirebaseSubject,
  FirebaseQuiz
} from '@/lib/firestore';

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [classData, setClassData] = useState<FirebaseClass | null>(null);
  const [subjects, setSubjects] = useState<FirebaseSubject[]>([]);
  const [quizzes, setQuizzes] = useState<FirebaseQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPresident, setIsPresident] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'quizzes' | 'members'>('overview');
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user?.email) {
      router.push('/');
      return;
    }
    
    loadClassData();
  }, [params.id, user]);

  const loadClassData = async () => {
    if (!params.id || !user?.uid || !user?.email) return;
    
    try {
      setLoading(true);
      
      // Load class data
      const classInfo = await getClassById(params.id as string);
      if (!classInfo) {
        router.push('/classes');
        return;
      }
      
      // Check if user is a member
      if (!classInfo.members.includes(user.email)) {
        router.push('/classes');
        return;
      }
      
      setClassData(classInfo);
      setIsPresident(classInfo.memberRoles[user.email] === 'president');
      
      // Load subjects and quizzes
      const [subjectsData, quizzesData] = await Promise.all([
        getClassSubjects(params.id as string),
        getClassQuizzes(params.id as string)
      ]);
      
      setSubjects(subjectsData);
      setQuizzes(quizzesData);
    } catch (error) {
      console.error('Error loading class data:', error);
      router.push('/classes');
    } finally {
      setLoading(false);
    }
  };

  const addSubject = async () => {
    if (!newSubjectName.trim() || !user?.email || !classData) return;
    
    try {
      setCreating(true);
      const subjectId = await createSubject(
        newSubjectName.trim(),
        user.uid,
        classData.id
      );
      // Reload subjects to show the new one
      const updatedSubjects = await getClassSubjects(classData.id);
      setSubjects(updatedSubjects);
      setNewSubjectName("");
      setShowAddSubject(false);
      alert("Subject created successfully!");
    } catch (error) {
      console.error('Error creating subject:', error);
      alert("Failed to create subject. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const deleteSubject = async (subjectId: string) => {
    if (!user?.email || !classData) return;
    
    if (confirm("Are you sure you want to delete this subject?")) {
      try {
        // TODO: Implement deleteSubject function in firestore.ts
        // For now, just reload the subjects to refresh the view
        const updatedSubjects = await getClassSubjects(classData.id);
        setSubjects(updatedSubjects);
        alert("Subject deleted successfully!");
      } catch (error) {
        console.error('Error deleting subject:', error);
        alert("Failed to delete subject. Please try again.");
      }
    }
  };

  const shareQuizToClass = (quizKey: string) => {
    if (!classData) return;
    
    // TODO: Implement proper quiz sharing with Firebase
    alert("Quiz sharing feature needs to be implemented with Firebase!");
  };

  const copyClassCode = () => {
    if (classData) {
      navigator.clipboard.writeText(classData.code);
      alert("Class code copied to clipboard!");
    }
  };

  if (!user || !classData || loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex justify-between items-center mb-8 sm:mb-12">
          <div className="text-xl sm:text-2xl font-bold text-white">🧠 QuizGod</div>
          <NavBar />
        try {
          setCreating(true);
          const subjectId = await createSubject(
            newSubjectName.trim(),
            user.uid,
            classData.id
          );
          // Reload subjects to show the new one
          const updatedSubjects = await getClassSubjects(classData.id);
          setSubjects(updatedSubjects);
          setNewSubjectName("");
          setShowAddSubject(false);
          alert("Subject created successfully!");
        } catch (error) {
          console.error('Error creating subject:', error);
          alert("Failed to create subject. Please try again.");
        } finally {
          setCreating(false);
        }
              </div>
            </div>
            <div className="text-right">
              <div className="bg-white/20 backdrop-blur-md rounded-lg p-4">
                <div className="text-2xl font-mono font-bold text-cyan-300">{classData.code}</div>
                <button 
                  onClick={copyClassCode}
                  className="text-sm text-purple-200 hover:text-white mt-1 transition-colors"
                >
                  📋 Copy Code
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 mb-6">
          <div className="flex space-x-4 flex-wrap gap-2">
            {[
              { id: 'overview', label: '📊 Overview', icon: '📊' },
              { id: 'subjects', label: '📚 Subjects', icon: '📚' },
              { id: 'quizzes', label: '📝 Quizzes', icon: '📝' },
              { id: 'members', label: '👥 Members', icon: '👥' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-6 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                    : 'bg-white/10 text-purple-200 hover:bg-white/20 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 text-center">
                <div className="text-3xl mb-2">👥</div>
                <div className="text-2xl font-bold text-white">{classData.members.length}</div>
                <div className="text-purple-200">Active Members</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 text-center">
                <div className="text-3xl mb-2">📚</div>
                <div className="text-2xl font-bold text-white">{subjects.length}</div>
                <div className="text-purple-200">Subjects</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 text-center">
                <div className="text-3xl mb-2">📝</div>
                <div className="text-2xl font-bold text-white">{quizzes.length}</div>
                <div className="text-purple-200">Shared Quizzes</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-white">🎯 Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    href="/create"
                    className="block w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 text-center font-medium"
                  >
                    ➕ Create New Quiz
                  </Link>
                  <Link
                    href="/ai-quiz"
                    className="block w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 text-center font-medium"
                  >
                    🤖 Generate AI Quiz
                  </Link>
                  <Link
                    href={`/classes/${classData.id}/leaderboard`}
                    className="block w-full px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 text-center font-medium"
                  >
                    🏆 View Leaderboard
                  </Link>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-white">📈 Class Activity</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-white/20">
                    <span className="text-purple-200">Class created</span>
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
                    <span className="text-green-600 font-semibold">{classData.members.length}</span>
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
                      Created by {subject.userId}
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
                {classData.members.length} member{classData.members.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classData.members.map((member) => (
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
    </div>
  );
}
