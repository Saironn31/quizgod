"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SideNav from '@/components/SideNav';
import { getAllUsers, setUserPremium, isUserAdmin, getUserQuizRecords, getUserClasses, getAllUserQuizzes } from '@/lib/firestore';
import { useRouter } from 'next/navigation';

interface User {
  uid: string;
  email: string;
  name: string;
  username?: string;
  isPremium?: boolean;
  role?: 'user' | 'admin';
  createdAt: any;
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.uid) {
        router.push('/');
        return;
      }

      try {
        const adminStatus = await isUserAdmin(user.uid);
        if (!adminStatus) {
          router.push('/');
          return;
        }
        setIsAdmin(true);

        const allUsers = await getAllUsers(user.uid);
        setUsers(allUsers);
      } catch (error) {
        console.error('Admin check failed:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user, router]);

  const togglePremium = async (targetUid: string, currentStatus: boolean) => {
    if (!user?.uid) return;
    
    setUpdating(targetUid);
    try {
      await setUserPremium(user.uid, targetUid, !currentStatus);
      setUsers(prev => prev.map(u => 
        u.uid === targetUid ? { ...u, isPremium: !currentStatus } : u
      ));
    } catch (error) {
      console.error('Failed to update premium status:', error);
      alert('Failed to update premium status');
    } finally {
      setUpdating(null);
    }
  };

  const viewUserStats = async (targetUser: User) => {
    setSelectedUser(targetUser);
    setLoadingStats(true);
    
    try {
      // Fetch all user data
      const [quizRecords, classes, quizzes] = await Promise.all([
        getUserQuizRecords(targetUser.uid),
        getUserClasses(targetUser.email),
        getAllUserQuizzes(targetUser.uid, targetUser.email)
      ]);

      // Calculate statistics
      const totalQuizzesTaken = quizRecords.length;
      const totalScore = quizRecords.reduce((sum, r) => sum + r.score, 0);
      const totalPossible = quizRecords.reduce((sum, r) => sum + Math.max(r.score, 1), 0);
      const avgScore = totalQuizzesTaken > 0 ? Math.round((totalScore / totalQuizzesTaken) * 100) : 0;
      
      // Get unique subjects from quiz records
      const subjects = new Set<string>();
      quizRecords.forEach(r => {
        if ((r as any).subject) subjects.add((r as any).subject);
      });

      // Recent activity (last 10 quiz attempts)
      const recentActivity = quizRecords
        .sort((a, b) => {
          const timeA = a.timestamp instanceof Date ? a.timestamp : new Date(0);
          const timeB = b.timestamp instanceof Date ? b.timestamp : new Date(0);
          return timeB.getTime() - timeA.getTime();
        })
        .slice(0, 10);

      setUserStats({
        totalQuizzesTaken,
        avgScore,
        totalQuizzesCreated: quizzes.length,
        totalClasses: classes.length,
        classesAsPresident: classes.filter(c => c.memberRoles[targetUser.email] === 'president').length,
        totalSubjects: subjects.size,
        recentActivity,
        quizzes: quizzes.slice(0, 10), // Latest 10 created quizzes
        classes
      });
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      alert('Failed to load user statistics');
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mb-4"></div>
          <p className="text-white text-xl">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    return (
      u.email?.toLowerCase().includes(term) ||
      u.name?.toLowerCase().includes(term) ||
      u.username?.toLowerCase().includes(term) ||
      u.uid.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950">
      <SideNav />
      <div className="md:ml-64 min-h-screen p-6 md:p-12 pb-32 md:pb-12">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 right-20 w-96 h-96 bg-red-500/5 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-orange-500/5 rounded-full filter blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
        </div>

        <div className="relative z-10 mb-8">
          <div className="glass-card rounded-3xl p-8 md:p-12 bg-gradient-to-br from-red-500/10 to-orange-500/10 border-2 border-white/10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl md:text-6xl font-black mb-3">
                  <span className="text-white">Admin Panel</span>
                </h1>
                <p className="text-slate-300 text-lg">Manage users and premium subscriptions</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <div className="glass-card rounded-3xl p-6 md:p-8 animate-slide-up">
            <div className="mb-6">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search users by name, email, username, or UID..."
                className="px-6 py-4 text-base rounded-2xl border border-purple-300/50 bg-white/10 backdrop-blur-sm text-white w-full focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder-slate-400 transition-all"
              />
            </div>

            <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
              <p className="text-slate-300">
                Total Users: <span className="font-bold text-white">{users.length}</span>
                {" | "}
                Premium: <span className="font-bold text-emerald-400">{users.filter(u => u.isPremium).length}</span>
                {" | "}
                Free: <span className="font-bold text-slate-400">{users.filter(u => !u.isPremium).length}</span>
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-slate-300 font-semibold">User</th>
                    <th className="text-left p-4 text-slate-300 font-semibold">Email</th>
                    <th className="text-left p-4 text-slate-300 font-semibold">UID</th>
                    <th className="text-center p-4 text-slate-300 font-semibold">Status</th>
                    <th className="text-center p-4 text-slate-300 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.uid} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div>
                          <div className="font-semibold text-white">{u.name}</div>
                          {u.username && <div className="text-sm text-slate-400">@{u.username}</div>}
                        </div>
                      </td>
                      <td className="p-4 text-slate-300">{u.email}</td>
                      <td className="p-4 text-xs text-slate-400 font-mono">{u.uid.slice(0, 12)}...</td>
                      <td className="p-4 text-center">
                        {u.role === 'admin' ? (
                          <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm font-semibold">
                            Admin
                          </span>
                        ) : u.isPremium ? (
                          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-semibold">
                            Premium
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-slate-500/20 text-slate-300 rounded-full text-sm font-semibold">
                            Free
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => viewUserStats(u)}
                            className="px-3 py-2 rounded-lg font-semibold transition-all bg-blue-600 hover:bg-blue-700 text-white text-sm"
                          >
                            View Stats
                          </button>
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => togglePremium(u.uid, u.isPremium || false)}
                              disabled={updating === u.uid}
                              className={`px-3 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 text-sm ${
                                u.isPremium
                                  ? 'bg-slate-600 hover:bg-slate-700 text-white'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              {updating === u.uid ? '...' : u.isPremium ? 'Revoke' : 'Grant'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-400 text-lg">No users found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Stats Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-slate-900 rounded-3xl p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">{selectedUser.name}</h2>
                <p className="text-slate-400">@{selectedUser.username || selectedUser.email}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-white transition-colors text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {loadingStats ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
                <p className="text-slate-300">Loading statistics...</p>
              </div>
            ) : userStats ? (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="glass-card rounded-xl p-4">
                    <div className="text-slate-400 text-sm mb-1">Quizzes Taken</div>
                    <div className="text-2xl font-bold text-white">{userStats.totalQuizzesTaken}</div>
                  </div>
                  <div className="glass-card rounded-xl p-4">
                    <div className="text-slate-400 text-sm mb-1">Avg Score</div>
                    <div className="text-2xl font-bold text-emerald-400">{userStats.avgScore}%</div>
                  </div>
                  <div className="glass-card rounded-xl p-4">
                    <div className="text-slate-400 text-sm mb-1">Quizzes Created</div>
                    <div className="text-2xl font-bold text-cyan-400">{userStats.totalQuizzesCreated}</div>
                  </div>
                  <div className="glass-card rounded-xl p-4">
                    <div className="text-slate-400 text-sm mb-1">Classes</div>
                    <div className="text-2xl font-bold text-violet-400">{userStats.totalClasses}</div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="glass-card rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Recent Quiz Activity</h3>
                  {userStats.recentActivity.length > 0 ? (
                    <div className="space-y-2">
                      {userStats.recentActivity.map((activity: any, idx: number) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                          <div>
                            <div className="text-white font-medium text-sm">{activity.quizTitle || 'Untitled Quiz'}</div>
                            <div className="text-slate-400 text-xs">
                              {activity.timestamp instanceof Date ? activity.timestamp.toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-bold">{activity.score} pts</div>
                            <div className="text-xs text-slate-400">{activity.percentage || 0}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-center py-8">No quiz activity yet</p>
                  )}
                </div>

                {/* Created Quizzes */}
                <div className="glass-card rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Created Quizzes</h3>
                  {userStats.quizzes.length > 0 ? (
                    <div className="space-y-2">
                      {userStats.quizzes.map((quiz: any, idx: number) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-3">
                          <div className="text-white font-medium text-sm">{quiz.title}</div>
                          <div className="text-slate-400 text-xs">
                            {quiz.subject} • {quiz.questions?.length || 0} questions
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-center py-8">No quizzes created yet</p>
                  )}
                </div>

                {/* Classes */}
                <div className="glass-card rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Classes</h3>
                  {userStats.classes.length > 0 ? (
                    <div className="space-y-2">
                      {userStats.classes.map((cls: any, idx: number) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                          <div>
                            <div className="text-white font-medium text-sm">{cls.name}</div>
                            <div className="text-slate-400 text-xs">{cls.members?.length || 0} members</div>
                          </div>
                          <div>
                            {cls.memberRoles[selectedUser.email] === 'president' ? (
                              <span className="px-2 py-1 bg-violet-500/20 text-violet-300 rounded text-xs font-semibold">President</span>
                            ) : (
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-semibold">Member</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-center py-8">No classes joined yet</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
