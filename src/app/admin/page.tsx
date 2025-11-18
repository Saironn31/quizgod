"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SideNav from '@/components/SideNav';
import { getAllUsers, setUserPremium, isUserAdmin } from '@/lib/firestore';
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
      <div className="md:ml-64 min-h-screen p-6 md:p-12">
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
          <div className="glass-card rounded-3xl p-6 md:p-8">
            <div className="mb-6">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search users by name, email, username, or UID..."
                className="px-6 py-4 text-base rounded-2xl border border-purple-300/50 bg-white/10 backdrop-blur-sm text-white w-full focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder-slate-400 transition-all"
              />
            </div>

            <div className="mb-4 flex items-center justify-between">
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
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => togglePremium(u.uid, u.isPremium || false)}
                            disabled={updating === u.uid}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 ${
                              u.isPremium
                                ? 'bg-slate-600 hover:bg-slate-700 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            {updating === u.uid ? '...' : u.isPremium ? 'Revoke Premium' : 'Grant Premium'}
                          </button>
                        )}
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
    </div>
  );
}
