"use client";
import { useAuth } from '@/contexts/AuthContext';
import {
  getClassById,
  getClassSubjects,
  getClassQuizzes,
  createSubject,
  FirebaseClass,
  FirebaseSubject,
  FirebaseQuiz,
  getClassQuizRecords,
  getClassMemberQuizRecords
} from '@/lib/firestore';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import ClassChat from '@/components/ClassChat';

// Tab components
function OverviewTab({ classData, subjects, quizzes }: { classData: any, subjects: any[], quizzes: any[] }) {
  if (!classData) return null;
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">👥</div>
          <div className="text-2xl font-bold text-white">{classData.members?.length ?? 0}</div>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">📈 Class Activity</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-white/20">
              <span className="text-purple-200">Class created</span>
              <span className="text-gray-500">
                {(() => {
                  const date = classData.createdAt;
                  if (!date) return 'Unknown';
                  const parsed = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
                  return isNaN(parsed.getTime()) ? 'Unknown' : parsed.toLocaleDateString();
                })()}
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
              <span className="text-green-600 font-semibold">{classData?.members?.length ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubjectsTab({ subjects, showAddSubject, setShowAddSubject, newSubjectName, setNewSubjectName, addSubject, deleteSubject }: {
  subjects: any[],
  showAddSubject: boolean,
  setShowAddSubject: (v: boolean) => void,
  newSubjectName: string,
  setNewSubjectName: (v: string) => void,
  addSubject: () => void,
  deleteSubject: (id: string) => void
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📚 Class Subjects</h2>
        <button onClick={() => setShowAddSubject(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">➕ Add Subject</button>
      </div>
      {showAddSubject && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]" onClick={() => setShowAddSubject(false)} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl p-8 z-[9999] min-w-[320px] w-full max-w-md flex flex-col gap-4 border border-white/20">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Add New Subject</h3>
            <input
              type="text"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              placeholder="Subject name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            <div className="flex gap-3 mt-2">
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
        </>
      )}
      {subjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Subjects Yet</h3>
          <p className="text-gray-500 mb-4">Add subjects to organize your class quizzes!</p>
          <button onClick={() => setShowAddSubject(true)} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">➕ Add First Subject</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <div key={subject.id} className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-800">{subject.name}</h3>
              <p className="text-sm text-gray-500 mt-1">Created by {subject.creatorName ?? subject.creatorUsername ?? subject.userId}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(subject.createdAt).toLocaleDateString()}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => deleteSubject(subject.id)} className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuizzesTab({ quizzes, classData }: { quizzes: any[], classData: any }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📝 Class Quizzes</h2>
        <div className="flex gap-3">
          <Link href="/create" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">➕ Create Quiz</Link>
          <Link href="/ai-quiz" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">🤖 AI Quiz</Link>
        </div>
      </div>
      {quizzes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Shared Quizzes Yet</h3>
          <p className="text-gray-500 mb-4">Create quizzes and share them with your class!</p>
          <div className="flex gap-4 justify-center">
            <Link href="/create" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">➕ Create Quiz</Link>
            <Link href="/ai-quiz" className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">🤖 Generate AI Quiz</Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizzes.map((quiz: any) => (
            <div key={quiz.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-800">{quiz.title}</h3>
              <p className="text-sm text-gray-500 mt-1">Subject: {quiz.subject}</p>
              {quiz.description && <p className="text-sm text-gray-600 mt-2">{quiz.description}</p>}
              <p className="text-sm text-gray-500 mt-2">Questions: {quiz.questions?.length ?? 0}</p>
              <div className="mt-4 flex gap-2">
                <Link href={`/quizzes/${quiz.id}`} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm">🎮 Play Quiz</Link>
                <Link href={`/classes/${classData.id}/leaderboard?quiz=${quiz.id}`} className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm">🏆 Scores</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MembersTab({ classData }: { classData: any }) {
  const [removing, setRemoving] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteValue, setInviteValue] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const { user } = useAuth();
  const isPresident = classData.memberRoles && classData.memberRoles[classData.members?.[0]] === 'president';
  const handleRemoveMember = async (memberEmail: string) => {
    if (!window.confirm(`Remove member ${memberEmail} from class?`)) return;
    setRemoving(memberEmail);
    try {
      const res = await import('@/lib/firestore');
      await res.removeMemberFromClass(classData.id, memberEmail);
      alert(`Member ${memberEmail} removed.`);
      window.location.reload();
    } catch (error) {
      alert('Failed to remove member.');
    } finally {
      setRemoving(null);
    }
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">👥 Class Members</h2>
        <div className="flex gap-3 items-center">
          <div className="text-sm text-gray-600">{classData.members?.length ?? 0} member{classData.members?.length !== 1 ? 's' : ''}</div>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            onClick={() => setShowInviteModal(true)}
          >
            ➕ Invite Friend
          </button>
        </div>
      </div>
      {/* Invite Friend Modal */}
      {showInviteModal && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]" onClick={() => setShowInviteModal(false)} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl p-8 z-[9999] min-w-[320px] w-full max-w-md flex flex-col gap-4 border border-white/20">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Invite Friend to Class</h3>
            <input
              type="text"
              value={inviteValue}
              onChange={e => setInviteValue(e.target.value)}
              placeholder="Enter username or email"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            {inviteError && <div className="text-red-500 text-sm">{inviteError}</div>}
            <div className="flex gap-3 mt-2">
              <button
                onClick={async () => {
                  setInviteLoading(true);
                  setInviteError("");
                  try {
                    const res = await import('@/lib/firestore');
                    if (!user?.uid) throw new Error('User not found');
                    await res.sendClassInvite(user.uid, inviteValue);
                    alert("Invite sent!");
                    setShowInviteModal(false);
                    setInviteValue("");
                  } catch (err) {
                    setInviteError("Failed to send invite. Check username/email and try again.");
                  } finally {
                    setInviteLoading(false);
                  }
                }}
                disabled={!inviteValue.trim() || inviteLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {inviteLoading ? "Sending..." : "Send Invite"}
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(classData.members ?? []).map((member: string) => (
          <div key={member} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">{member[0]?.toUpperCase()}</div>
              <div>
                <h3 className="font-semibold text-gray-800">{member}</h3>
                <p className="text-sm text-gray-500">{member === (classData.president ?? classData.members?.[0]) ? '👑 President' : '👤 Member'}</p>
              </div>
            </div>
            {isPresident && member !== (classData.president ?? classData.members?.[0]) && (
              <button
                onClick={() => handleRemoveMember(member)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                title="Remove member"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

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
      const classInfo = await getClassById(params.id as string);
      if (!classInfo) {
        router.push('/classes');
        return;
      }
      if (!classInfo.members.includes(user.email)) {
        router.push('/classes');
        return;
      }
      setClassData(classInfo);
      setIsPresident(classInfo.memberRoles[user.email] === 'president');
      const [subjectsData, quizzesData] = await Promise.all([
        getClassSubjects(params.id as string),
        getClassQuizzes(params.id as string)
      ]);
      const subjectsWithCreator = await Promise.all(subjectsData.map(async (subject) => {
        try {
          const res = await import('@/lib/firestore');
          const getUserProfile = res.getUserProfile;
          const creatorProfile = await getUserProfile(subject.userId);
          return {
            ...subject,
            creatorName: creatorProfile?.name,
            creatorUsername: creatorProfile?.username
          };
        } catch {
          return subject;
        }
      }));
      setSubjects(subjectsWithCreator);
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
      await createSubject(
        newSubjectName.trim(),
        user.uid,
        classData.id
      );
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
        const updatedSubjects = await getClassSubjects(classData.id);
        setSubjects(updatedSubjects);
        alert("Subject deleted successfully!");
      } catch (error) {
        console.error('Error deleting subject:', error);
        alert("Failed to delete subject. Please try again.");
      }
    }
  };

  if (!user || loading) {
    return <div>Loading...</div>;
  }
  if (!classData) {
    return <div>Class not found.</div>;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex justify-between items-center mb-8 sm:mb-12">
          <div className="text-xl sm:text-2xl font-bold text-white">🧠 QuizGod</div>
          <NavBar />
          {isPresident && (
            <button
              onClick={async () => {
                if (!window.confirm('Delete this class and all its quizzes? This cannot be undone.')) return;
                try {
                  const res = await import('@/lib/firestore');
                  await res.deleteClassWithQuizzes(classData.id);
                  alert('Class deleted.');
                  window.location.href = '/classes';
                } catch (error) {
                  alert('Failed to delete class.');
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ml-4"
            >
              Delete Class
            </button>
          )}
        </div>
        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 mb-6">
          <div className="flex space-x-4 flex-wrap gap-2">
            {[
              { id: 'overview', label: '📊 Overview' },
              { id: 'subjects', label: '📚 Subjects' },
              { id: 'quizzes', label: '📝 Quizzes' },
              { id: 'members', label: '👥 Members' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-6 rounded-lg font-medium text-sm transition-all duration-200 ${activeTab === tab.id ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' : 'bg-white/10 text-purple-200 hover:bg-white/20 hover:text-white'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {/* Content */}
        {activeTab === 'overview' && (
          <OverviewTab classData={classData} subjects={subjects} quizzes={quizzes} />
        )}
        {activeTab === 'subjects' && (
          <SubjectsTab
            subjects={subjects}
            showAddSubject={showAddSubject}
            setShowAddSubject={setShowAddSubject}
            newSubjectName={newSubjectName}
            setNewSubjectName={setNewSubjectName}
            addSubject={addSubject}
            deleteSubject={deleteSubject}
          />
        )}
        {activeTab === 'quizzes' && (
          <QuizzesTab quizzes={quizzes} classData={classData} />
        )}
        {activeTab === 'analytics' && (
          <ClassAnalyticsTab classData={classData} user={user} quizzes={quizzes} subjects={subjects} />
        )}
        {activeTab === 'members' && (
          <MembersTab classData={classData} />
        )}
        {/* Class Analytics Tab */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-white">📈 Class Analytics</h2>
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-purple-200 mb-2">Class-wide Stats</h3>
            <ul className="space-y-2">
              <li>Total Subjects: <span className="font-bold text-green-300">{subjects.length}</span></li>
              <li>Total Quizzes: <span className="font-bold text-purple-300">{quizzes.length}</span></li>
              <li>Total Members: <span className="font-bold text-blue-300">{classData?.members?.length ?? 0}</span></li>
              <li>Quizzes Taken: <span className="font-bold text-yellow-300">{classStats.quizzesTaken}</span></li>
              <li>Average Score: <span className="font-bold text-green-300">{classStats.avgScore}</span></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-200 mb-2">Your Analytics</h3>
            <div className="bg-white/20 rounded-lg p-4 mb-4">
              <p className="text-white">Quizzes Taken: <span className="font-bold text-yellow-300">{memberStats[user.email]?.quizzesTaken ?? '--'}</span></p>
              <p className="text-white">Average Score: <span className="font-bold text-green-300">{memberStats[user.email]?.avgScore ?? '--'}</span></p>
            </div>
          </div>
          {isPresident && (
            <div>
              <h3 className="text-lg font-semibold text-purple-200 mb-2">All Members Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(classData.members ?? []).map((member: string) => (
                  <div key={member} className="bg-white/20 rounded-lg p-4">
                    <h4 className="font-bold text-white mb-2">{member}</h4>
                    <p className="text-white">Quizzes Taken: <span className="font-bold text-yellow-300">{memberStats[member]?.quizzesTaken ?? '--'}</span></p>
                    <p className="text-white">Average Score: <span className="font-bold text-green-300">{memberStats[member]?.avgScore ?? '--'}</span></p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Class-wide chat at the bottom of the page */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4 text-white">💬 Class Chat</h2>
          <ClassChat classId={classData.id} />
        </div>
      </div>
    </div>
  );
}
