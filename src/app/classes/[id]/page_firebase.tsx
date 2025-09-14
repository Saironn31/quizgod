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
    if (!newSubjectName.trim() || !user?.uid || !params.id) {
      alert("Please enter a subject name");
      return;
    }

    // Check if subject already exists
    const subjectExists = subjects.some(subject => 
      subject.name.toLowerCase() === newSubjectName.toLowerCase()
    );
    if (subjectExists) {
      alert("A subject with this name already exists in this class!");
      return;
    }

    try {
      setCreating(true);
      await createSubject(newSubjectName.trim(), user.uid, params.id as string);
      
      // Reload subjects to show the new one
      const updatedSubjects = await getClassSubjects(params.id as string);
      setSubjects(updatedSubjects);
      
      setNewSubjectName("");
      setShowAddSubject(false);
      alert("Subject added successfully!");
    } catch (error) {
      console.error('Error creating subject:', error);
      alert("Failed to add subject. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Please log in to view class details</h1>
              <Link href="/" className="text-blue-400 hover:underline">
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex justify-between items-center mb-8">
            <div className="text-xl sm:text-2xl font-bold text-white">🧠 QuizGod</div>
            <NavBar />
          </div>
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="text-center">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-purple-200">Loading class details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Class not found</h1>
              <Link href="/classes" className="text-blue-400 hover:underline">
                Back to Classes
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
        <div className="flex justify-between items-center mb-8">
          <div className="text-xl sm:text-2xl font-bold text-white">🧠 QuizGod</div>
          <NavBar />
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Link href="/classes" className="text-purple-200 hover:text-white transition-colors">
                    ← Back to Classes
                  </Link>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">{classData.name}</h1>
                {classData.description && (
                  <p className="text-purple-200 mb-4">{classData.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-purple-200">
                  <span>📅 Created {formatDate(classData.createdAt)}</span>
                  <span>👥 {classData.members.length} member{classData.members.length !== 1 ? 's' : ''}</span>
                  <span>🔗 Join Code: <span className="font-mono bg-purple-800 px-2 py-1 rounded">{classData.joinCode}</span></span>
                  {isPresident && <span className="bg-yellow-600 px-2 py-1 rounded text-xs font-semibold">President</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Link 
                  href={`/create?class=${params.id}`}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg text-sm font-medium"
                >
                  ➕ Create Quiz
                </Link>
                <Link 
                  href={`/classes/${params.id}/leaderboard`}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg text-sm font-medium"
                >
                  🏆 Leaderboard
                </Link>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
            <div className="flex border-b border-white/20">
              {[
                { key: 'overview', label: '📊 Overview', count: null },
                { key: 'subjects', label: '📚 Subjects', count: subjects.length },
                { key: 'quizzes', label: '🎮 Quizzes', count: quizzes.length },
                { key: 'members', label: '👥 Members', count: classData.members.length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'text-white bg-white/20 border-b-2 border-purple-400'
                      : 'text-purple-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && (
                    <span className="ml-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold">{subjects.length}</div>
                      <div className="text-sm opacity-90">Subjects</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold">{quizzes.length}</div>
                      <div className="text-sm opacity-90">Quizzes</div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold">{classData.members.length}</div>
                      <div className="text-sm opacity-90">Members</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Subjects */}
                    <div className="bg-white/5 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-3">📚 Recent Subjects</h3>
                      {subjects.slice(0, 3).map((subject) => (
                        <div key={subject.id} className="flex justify-between items-center py-2 border-b border-white/10 last:border-b-0">
                          <span className="text-purple-200">{subject.name}</span>
                          <span className="text-xs text-purple-300">{formatDate(subject.createdAt)}</span>
                        </div>
                      ))}
                      {subjects.length === 0 && (
                        <p className="text-purple-300 text-sm">No subjects yet</p>
                      )}
                    </div>

                    {/* Recent Quizzes */}
                    <div className="bg-white/5 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-3">🎮 Recent Quizzes</h3>
                      {quizzes.slice(0, 3).map((quiz) => (
                        <div key={quiz.id} className="flex justify-between items-center py-2 border-b border-white/10 last:border-b-0">
                          <div>
                            <div className="text-purple-200">{quiz.title}</div>
                            <div className="text-xs text-purple-300">{quiz.subject}</div>
                          </div>
                          <span className="text-xs text-purple-300">{formatDate(quiz.createdAt)}</span>
                        </div>
                      ))}
                      {quizzes.length === 0 && (
                        <p className="text-purple-300 text-sm">No quizzes yet</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Subjects Tab */}
              {activeTab === 'subjects' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Class Subjects</h2>
                    {isPresident && (
                      <button
                        onClick={() => setShowAddSubject(!showAddSubject)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-lg text-sm font-medium"
                      >
                        {showAddSubject ? "Cancel" : "➕ Add Subject"}
                      </button>
                    )}
                  </div>

                  {showAddSubject && (
                    <div className="bg-white/5 rounded-lg p-4 mb-4">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={newSubjectName}
                          onChange={(e) => setNewSubjectName(e.target.value)}
                          className="flex-1 p-3 border border-purple-300 bg-white/10 text-white placeholder-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Enter subject name..."
                          onKeyPress={(e) => e.key === 'Enter' && addSubject()}
                        />
                        <button
                          onClick={addSubject}
                          disabled={creating || !newSubjectName.trim()}
                          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                        >
                          {creating ? "Adding..." : "Add"}
                        </button>
                      </div>
                    </div>
                  )}

                  {subjects.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-purple-300 rounded-lg">
                      <div className="text-4xl mb-4">📚</div>
                      <h3 className="text-lg font-semibold text-white mb-2">No subjects yet</h3>
                      <p className="text-purple-200">Add subjects to organize your class content!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {subjects.map((subject) => (
                        <div key={subject.id} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
                          <h3 className="text-lg font-semibold text-white mb-2">{subject.name}</h3>
                          <div className="text-sm text-purple-300">
                            Created {formatDate(subject.createdAt)}
                          </div>
                          <div className="mt-3">
                            <Link 
                              href={`/create?subject=${encodeURIComponent(subject.name)}&class=${params.id}`}
                              className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded transition-colors"
                            >
                              Create Quiz
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Quizzes Tab */}
              {activeTab === 'quizzes' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Class Quizzes</h2>
                    <Link 
                      href={`/create?class=${params.id}`}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg text-sm font-medium"
                    >
                      ➕ Create Quiz
                    </Link>
                  </div>

                  {quizzes.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-purple-300 rounded-lg">
                      <div className="text-4xl mb-4">🎮</div>
                      <h3 className="text-lg font-semibold text-white mb-2">No quizzes yet</h3>
                      <p className="text-purple-200">Create the first quiz for this class!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {quizzes.map((quiz) => (
                        <div key={quiz.id} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
                          <h3 className="text-lg font-semibold text-white mb-2">{quiz.title}</h3>
                          <div className="text-sm text-purple-300 mb-2">{quiz.subject}</div>
                          {quiz.description && (
                            <p className="text-sm text-purple-200 mb-3 line-clamp-2">{quiz.description}</p>
                          )}
                          <div className="flex justify-between items-center text-xs text-purple-300 mb-3">
                            <span>{quiz.questions.length} questions</span>
                            <span>{formatDate(quiz.createdAt)}</span>
                          </div>
                          <Link 
                            href={`/quizzes/${quiz.id}`}
                            className="block text-center bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded transition-colors text-sm font-medium"
                          >
                            🎮 Play Quiz
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Members Tab */}
              {activeTab === 'members' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-white">Class Members</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classData.members.map((memberEmail) => (
                      <div key={memberEmail} className="bg-white/5 rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <div className="text-white font-medium">{memberEmail}</div>
                          <div className="text-sm text-purple-300">
                            {classData.memberRoles[memberEmail] === 'president' ? 'President' : 'Member'}
                          </div>
                        </div>
                        {classData.memberRoles[memberEmail] === 'president' && (
                          <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs font-semibold">
                            👑 President
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}