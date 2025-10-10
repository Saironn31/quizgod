"use client";
import React, { useState } from 'react';
import NavBar from '@/components/NavBar';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile } from '@/lib/firestore';

const ProfilePage: React.FC = () => {
  const { userProfile, user, refreshUserProfile } = useAuth();
  const [name, setName] = useState(userProfile?.name || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      if (!user?.uid) throw new Error('User not logged in');
      await updateUserProfile(user.uid, { name, email, ...(bio && { bio }) });
      setMessage('Profile updated!');
      if (refreshUserProfile) {
        refreshUserProfile();
      }
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex justify-between items-center mb-8 sm:mb-12">
          <div className="text-xl sm:text-2xl font-bold text-white">👤 Profile</div>
          <NavBar />
        </div>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 w-full shadow-2xl border border-purple-400">
            <h2 className="text-2xl font-bold mb-4 text-purple-700 dark:text-purple-300 text-center">Edit Profile</h2>
            <form className="flex flex-col gap-4" onSubmit={handleSave}>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Name</label>
              <input className="px-3 py-2 rounded-xl border border-purple-300 bg-white/20 text-black dark:text-white" value={name} onChange={e => setName(e.target.value)} />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
              <input className="px-3 py-2 rounded-xl border border-purple-300 bg-white/20 text-black dark:text-white" value={email} onChange={e => setEmail(e.target.value)} />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Bio</label>
              <textarea className="px-3 py-2 rounded-xl border border-purple-300 bg-white/20 text-black dark:text-white" value={bio} onChange={e => setBio(e.target.value)} />
              <button type="submit" className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-xl font-medium shadow hover:bg-purple-800/80 transition-all" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
              {message && <div className="text-green-600 dark:text-green-300 text-center mt-2">{message}</div>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
