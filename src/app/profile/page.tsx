"use client";
import React, { useState } from 'react';
import SideNav from '@/components/SideNav';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile } from '@/lib/firestore';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

const ProfilePage: React.FC = () => {
  const { userProfile, user, refreshUserProfile } = useAuth();
  const [name, setName] = useState(userProfile?.name || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  // Change password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage('');
    
    try {
      // Validation
      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error('Please fill in all password fields');
      }
      
      if (newPassword !== confirmPassword) {
        throw new Error('New passwords do not match');
      }
      
      if (newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters');
      }
      
      if (!user || !user.email) {
        throw new Error('User not logged in');
      }
      
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      setPasswordMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('auth/wrong-password') || err.message.includes('auth/invalid-credential')) {
          setPasswordMessage('Current password is incorrect');
        } else {
          setPasswordMessage(err.message);
        }
      } else {
        setPasswordMessage('Failed to change password');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <SideNav />
      <div className="md:ml-64 min-h-screen p-4 md:p-8 pb-32 md:pb-8">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-500/5 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-violet-500/5 rounded-full filter blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
        </div>
        <div className="relative z-10 mb-8">
          <div className="glass-card rounded-3xl p-8 md:p-12 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-2 border-white/10">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-4xl md:text-6xl font-black mb-3">
                  <span className="text-white">Profile</span>
                </h1>
                <p className="text-slate-300 text-lg">Manage your account details</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="glass-card rounded-3xl p-8 md:p-12 bg-gradient-to-br from-white/10 to-purple-900/10 border-2 border-white/10 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-purple-700 dark:text-purple-300 text-center">Edit Profile</h2>
            <form className="flex flex-col gap-4" onSubmit={handleSave}>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Name</label>
              <input className="px-3 py-2 rounded-xl border border-purple-300 bg-white/20 text-black dark:text-white" value={name} onChange={e => setName(e.target.value)} />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
              <input className="px-3 py-2 rounded-xl border border-purple-300 bg-white/20 text-black dark:text-white" value={email} onChange={e => setEmail(e.target.value)} />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Bio</label>
              <textarea className="px-3 py-2 rounded-xl border border-purple-300 bg-white/20 text-black dark:text-white" value={bio} onChange={e => setBio(e.target.value)} />
              <button type="submit" className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-xl font-medium shadow hover:bg-purple-800/80 transition-all" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
              {message && <div className={`text-center mt-2 ${message.includes('Failed') || message.includes('Error') ? 'text-red-600 dark:text-red-300' : 'text-green-600 dark:text-green-300'}`}>{message}</div>}
            </form>
          </div>
          
          <div className="glass-card rounded-3xl p-8 md:p-12 bg-gradient-to-br from-white/10 to-red-900/10 border-2 border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-red-700 dark:text-red-300">Change Password</h2>
              <button
                onClick={() => {
                  setShowPasswordForm(!showPasswordForm);
                  if (showPasswordForm) {
                    // Reset form when closing
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordMessage('');
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all"
              >
                {showPasswordForm ? 'Cancel' : 'Change Password'}
              </button>
            </div>
            {showPasswordForm && (
              <form className="flex flex-col gap-4" onSubmit={handleChangePassword}>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Current Password</label>
                <input 
                  type="password" 
                  className="px-3 py-2 rounded-xl border border-red-300 bg-white/20 text-black dark:text-white" 
                  value={currentPassword} 
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">New Password</label>
                <input 
                  type="password" 
                  className="px-3 py-2 rounded-xl border border-red-300 bg-white/20 text-black dark:text-white" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 characters)"
                />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Confirm New Password</label>
                <input 
                  type="password" 
                  className="px-3 py-2 rounded-xl border border-red-300 bg-white/20 text-black dark:text-white" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
                <button type="submit" className="mt-4 px-6 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-medium shadow hover:from-red-700 hover:to-pink-700 transition-all" disabled={passwordLoading}>
                  {passwordLoading ? 'Changing Password...' : 'Update Password'}
                </button>
                {passwordMessage && <div className={`text-center mt-2 ${passwordMessage.includes('success') ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}`}>{passwordMessage}</div>}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
