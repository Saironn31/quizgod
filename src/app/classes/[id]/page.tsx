"use client";
import { useAuth } from '@/contexts/AuthContext';
import { User } from 'firebase/auth';
import {
  getClassById,
  getClassSubjects,
  getClassQuizzes,
  createSubject,
  FirebaseClass,
  FirebaseSubject,
  FirebaseQuiz,
  getClassQuizRecords,
  getClassMemberQuizRecords,
  deleteClassWithQuizzes
} from '@/lib/firestore';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ScoresButton from '@/components/ScoresButton';
import { useParams, useRouter } from 'next/navigation';
import SideNav from '@/components/SideNav';
import ClassChat from '@/components/ClassChat';
import ClassAnalyticsTab from './ClassAnalyticsTab';
import MemberAnalyticsTab from './MemberAnalyticsTab';

function OverviewTab({ classData, subjects, quizzes }: { classData: FirebaseClass, subjects: FirebaseSubject[], quizzes: FirebaseQuiz[] }) {
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
  subjects: FirebaseSubject[],
  showAddSubject: boolean,
  setShowAddSubject: (v: boolean) => void,
  newSubjectName: string,
  setNewSubjectName: (v: string) => void,
  addSubject: () => void,
  deleteSubject: (id: string) => void
}) {
  const [selectedSubject, setSelectedSubject] = useState<FirebaseSubject | null>(null);
  const [subjectQuizzes, setSubjectQuizzes] = useState<FirebaseQuiz[]>([]);

  const viewSubjectQuizzes = async (subject: FirebaseSubject) => {
    setSelectedSubject(subject);
    // Filter quizzes that belong to this subject
    const quizzes = await import('@/lib/firestore').then(res => res.getClassQuizzes(subject.classId || ''));
    const filteredQuizzes = quizzes.filter((quiz: FirebaseQuiz) => quiz.subjectId === subject.id || quiz.subject === subject.name);
    setSubjectQuizzes(filteredQuizzes);
  };

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
      {/* Subject Quizzes Modal */}
      {selectedSubject && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]" onClick={() => setSelectedSubject(null)} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl p-8 z-[9999] w-full max-w-4xl max-h-[80vh] overflow-y-auto flex flex-col gap-4 border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">📝 Quizzes in &ldquo;{selectedSubject.name}&rdquo;</h3>
              <button
                onClick={() => setSelectedSubject(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                ✕ Close
              </button>
            </div>
            {subjectQuizzes.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📝</div>
                <h4 className="text-lg font-semibold text-gray-700 mb-2">No Quizzes Yet</h4>
                <p className="text-gray-500">Create quizzes for this subject to see them here!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjectQuizzes.map((quiz: FirebaseQuiz) => (
                  <div key={quiz.id} className="bg-gray-50 rounded-lg p-4 border">
                    <h4 className="text-lg font-semibold text-gray-800">{quiz.title}</h4>
                    {quiz.description && <p className="text-sm text-gray-600 mt-1">{quiz.description}</p>}
                    <p className="text-sm text-gray-500 mt-2">Questions: {quiz.questions?.length ?? 0}</p>
                    <div className="mt-3 flex gap-2">
                      <Link href={`/quizzes/${quiz.id}`} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm">🎮 Play</Link>
                      <ScoresButton href={`/classes/${selectedSubject.classId}/leaderboard?quiz=${quiz.id}`}>
                        🏆 Scores
                      </ScoresButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                <button
                  onClick={() => viewSubjectQuizzes(subject)}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  📝 View Quizzes
                </button>
                <button onClick={() => deleteSubject(subject.id)} className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuizzesTab({ quizzes, classData }: { quizzes: FirebaseQuiz[], classData: FirebaseClass }) {
  const [sortBy, setSortBy] = useState<'name' | 'subject'>('name');

  // Load saved sort preference
  useEffect(() => {
    try {
      const { loadPreference } = require('@/utils/preferences');
      const saved = loadPreference('classes_sortBy');
      if (saved === 'name' || saved === 'subject') setSortBy(saved);
    } catch (e) {
      // ignore
    }
  }, []);

  // Save sort preference
  useEffect(() => {
    try {
      const { savePreference } = require('@/utils/preferences');
      savePreference('classes_sortBy', sortBy);
    } catch (e) {
      // ignore
    }
  }, [sortBy]);

  const sortedQuizzes = [...quizzes].sort((a, b) => {
    if (sortBy === 'name') {
      return a.title.localeCompare(b.title);
    } else {
      return (a.subject || '').localeCompare(b.subject || '');
    }
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📝 Class Quizzes</h2>
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'subject')}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Name</option>
              <option value="subject">Subject</option>
            </select>
          </div>
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
          {sortedQuizzes.map((quiz: FirebaseQuiz) => (
            <div key={quiz.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-800">{quiz.title}</h3>
              <p className="text-sm text-gray-500 mt-1">Subject: {quiz.subject}</p>
              {quiz.description && <p className="text-sm text-gray-600 mt-2">{quiz.description}</p>}
              <p className="text-sm text-gray-500 mt-2">Questions: {quiz.questions?.length ?? 0}</p>
              <div className="mt-4 flex gap-2">
                <Link href={`/quizzes/${quiz.id}`} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm">🎮 Play Quiz</Link>
                <ScoresButton href={`/classes/${classData.id}/leaderboard?quiz=${quiz.id}`}>
                  🏆 Scores
                </ScoresButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MembersTab({ classData, user, isPresident, setSelectedMember, setActiveTab }: {
  classData: FirebaseClass,
  user: User | null,
  isPresident: boolean,
  setSelectedMember: (m: string) => void,
  setActiveTab: (t: 'overview' | 'subjects' | 'quizzes' | 'analytics' | 'members' | 'memberAnalytics') => void
}) {
  const [removing, setRemoving] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteValue, setInviteValue] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
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
            <div className="flex flex-col gap-2 items-end">
              {isPresident && member !== (classData.president ?? classData.members?.[0]) && (
                <button
                  onClick={() => handleRemoveMember(member)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                  title="Remove member"
                >
                  Remove
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedMember(member);
                  setActiveTab('memberAnalytics');
                }}
                className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-xs"
                title="View Analytics"
              >
                Analytics
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ClassDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [inviteValue, setInviteValue] = useState("");
  const [classData, setClassData] = useState<FirebaseClass | null>(null);
  const [subjects, setSubjects] = useState<FirebaseSubject[]>([]);
  const [quizzes, setQuizzes] = useState<FirebaseQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPresident, setIsPresident] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'quizzes' | 'analytics' | 'members' | 'memberAnalytics'>('overview');
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  // Add classStats and memberStats state
  const [classStats, setClassStats] = useState({ quizzesTaken: 0, avgScore: 0 });
  const [memberStats, setMemberStats] = useState<{ [email: string]: { quizzesTaken: number; avgScore: number } }>({});

  useEffect(() => {
    if (!user?.email) {
      router.push('/');
      return;
    }
    loadClassData();
    loadAnalytics();
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

  // Load analytics for class and members
  const loadAnalytics = async () => {
    if (!params.id || !user?.uid || !user?.email) return;
    // Get all quiz records for the class
    const records = await getClassQuizRecords(params.id as string);
    const quizzesTaken = records.length;
    let totalPercent = 0;
    for (const r of records) {
      let percent = 0;
      if (r.quizId) {
        const quiz = quizzes.find(q => q.id === r.quizId);
        const maxScore = quiz?.questions?.length || 1;
        percent = maxScore > 0 ? (r.score / maxScore) * 100 : 0;
      }
      totalPercent += percent;
    }
    const avgScore = quizzesTaken > 0 ? Math.round(totalPercent / quizzesTaken) : 0;
    setClassStats({ quizzesTaken, avgScore });

    // Per-member stats
    const memberMap: { [email: string]: { quizzesTaken: number; avgScore: number } } = {};
    for (const member of classData?.members ?? []) {
      const memberRecords = records.filter(r => r.userId === member);
      const memberQuizzesTaken = memberRecords.length;
      let memberTotalPercent = 0;
      for (const r of memberRecords) {
        let percent = 0;
        if (r.quizId) {
          const quiz = quizzes.find(q => q.id === r.quizId);
          const maxScore = quiz?.questions?.length || 1;
          percent = maxScore > 0 ? (r.score / maxScore) * 100 : 0;
        }
        memberTotalPercent += percent;
      }
      const memberAvgScore = memberQuizzesTaken > 0 ? Math.round(memberTotalPercent / memberQuizzesTaken) : 0;
      memberMap[member] = { quizzesTaken: memberQuizzesTaken, avgScore: memberAvgScore };
    }
    setMemberStats(memberMap);
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

  const handleDeleteClass = async () => {
    if (!classData || !isPresident) return;
    
    const confirmMessage = `Are you sure you want to delete the class "${classData.name}"?\n\nThis will permanently delete:\n- The class\n- All subjects\n- All quizzes\n- All class data\n\nThis action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
      try {
        await deleteClassWithQuizzes(classData.id);
        alert("Class deleted successfully!");
        router.push('/classes');
      } catch (error) {
        console.error('Error deleting class:', error);
        alert("Failed to delete class. Please try again.");
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
                  <span className="text-white">Class Details</span>
                </h1>
                <p className="text-slate-300 text-lg">View and manage your class, subjects, and quizzes</p>
              </div>
              <div className="flex gap-3">
                <Link href="/classes" className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:scale-105 transition-all duration-300 shadow-glow">
                  My Classes
                </Link>
                {isPresident && (
                  <button 
                    onClick={handleDeleteClass}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold hover:scale-105 transition-all duration-300 shadow-glow"
                  >
                    🗑️ Delete Class
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Invite Code Section */}
        {isPresident && classData.joinCode && (
          <div className="relative z-10 mb-6">
            <div className="glass-card rounded-xl p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-400/30 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🔑</div>
                <div>
                  <p className="text-sm text-purple-200">Class Invite Code</p>
                  <p className="text-xl font-bold text-white tracking-wider">{classData.joinCode}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(classData.joinCode || '');
                  alert('Invite code copied to clipboard!');
                }}
                className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-all font-medium text-sm"
              >
                📋 Copy Code
              </button>
            </div>
          </div>
        )}
        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 mb-6">
          <div className="flex space-x-4 flex-wrap gap-2">
            {[
              { id: 'overview', label: '📊 Overview' },
              { id: 'subjects', label: '📚 Subjects' },
              { id: 'quizzes', label: '📝 Quizzes' },
              { id: 'analytics', label: '📈 Analytics' },
              { id: 'members', label: '👥 Members' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'subjects' | 'quizzes' | 'analytics' | 'members' | 'memberAnalytics')}
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
          <MembersTab classData={classData} user={user} isPresident={isPresident} setSelectedMember={setSelectedMember} setActiveTab={setActiveTab} />
        )}
        {activeTab === 'memberAnalytics' && selectedMember && (
          <MemberAnalyticsTab classId={classData.id} memberId={selectedMember} quizzes={quizzes} subjects={subjects} onBack={() => {
            setSelectedMember(null);
            setActiveTab('members');
          }} />
        )}
      </div>
    </div>
  );
}
