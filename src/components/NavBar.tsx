"use client";
import AddFriendForm from './AddFriendForm';
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { getFriendRequests, getUserQuizRecords } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
// import { uploadProfilePicture, deleteProfilePicture } from '@/lib/firestore';
import ChangeNameForm from './ChangeNameForm';
import { FaChartBar, FaCheckCircle, FaCalendarAlt } from 'react-icons/fa';

const NavBar: React.FC = () => {
  // All hooks and handlers inside function
  const { user, userProfile, logout, refreshUserProfile } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const router = typeof window !== 'undefined' ? require('next/navigation').useRouter() : null;

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.uid) return;
      // Friend request notification
      const requests = await getFriendRequests(user.uid);
      const pendingCount = requests.filter(r => r.type === 'received' && r.status === 'pending').length;
      const notifArr = [];
      if (pendingCount > 0) {
        notifArr.push({ id: 'friend', text: `You have ${pendingCount} new friend request${pendingCount > 1 ? 's' : ''}.`, link: '/friends' });
      }
      // Quiz played notification (dynamic)
      const res = await import('@/lib/firestore');
      const playCounts = await res.getQuizPlayCountsForUser(user.uid);
      Object.entries(playCounts).forEach(([quizId, count]) => {
        if (count > 0) {
          notifArr.push({ id: `quiz-${quizId}`, text: `Your quiz was played by ${count} user${count > 1 ? 's' : ''}.`, link: '/quiz-records' });
        }
      });
      // Example: class invite accepted (static, replace with real logic if needed)
      notifArr.push({ id: 'class', text: 'Class invite accepted.', link: '/classes' });
      setNotifications(notifArr);
    };
    fetchNotifications();
  }, [user?.uid]);
  // Handler for deleting profile picture
  // Removed profile picture delete handler

  // Handler for uploading profile picture
  // Removed profile picture upload handler

  // Handler to close mobile menu
  const closeMenu = () => {
    setIsMenuOpen(false);
  };
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user?.uid) return;
      const requests = await getFriendRequests(user.uid);
      setPendingRequests(requests.filter(r => r.type === 'received' && r.status === 'pending').length);
    };
    fetchRequests();
  }, [user]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // Removed file input ref for profile picture


  // Mobile menu toggle handler
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Get username from user profile or email fallback
  const getDisplayName = () => {
    // First try to use the actual name from the user profile
    if (userProfile?.name) {
      return userProfile.name;
    }
    // Fallback to username from profile if available
    if (userProfile?.username) {
      return userProfile.username;
    }
    // Last fallback to extracting from email
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Guest';
  };
  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false); // Close menu after logout
    } catch (error) {


      alert('Failed to delete profile picture');
    }
  };

  const [userStats, setUserStats] = useState<{ quizzesTaken: number; avgScore: number; lastQuizDate: Date | null }>({ quizzesTaken: 0, avgScore: 0, lastQuizDate: null });

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user?.uid) return;
      const records = await getUserQuizRecords(user.uid);
      const quizzesTaken = records.length;
      const avgScore = quizzesTaken > 0 ? Math.round(records.reduce((sum, r) => sum + (r.score || 0), 0) / quizzesTaken) : 0;
      const lastQuizDate = quizzesTaken > 0 ? records.reduce((latest, r) => r.timestamp > latest ? r.timestamp : latest, records[0].timestamp) : null;
      setUserStats({ quizzesTaken, avgScore, lastQuizDate });
    };
    fetchUserStats();
  }, [user?.uid]);

  // Removed triggerFileInput logic

  // Minimalistic NavBar design
  return (
    <nav className="bg-gradient-to-r from-[#181824] to-[#3a2a5d] px-6 py-3 flex items-center justify-between rounded-xl shadow-lg border border-white/10">
      {/* Logo and Brand */}
      <div className="flex items-center gap-3">
        <span className="text-pink-300 text-2xl font-bold">🧠 QuizGod</span>
      </div>
      {/* Navigation Links */}
      <div className="flex items-center gap-2">
        <Link href="/" className="text-white px-3 py-1 rounded hover:bg-white/10 transition text-sm font-medium">Home</Link>
        <Link href="/create" className="text-white px-3 py-1 rounded hover:bg-white/10 transition text-sm font-medium">Create</Link>
        <Link href="/ai-quiz" className="text-white px-3 py-1 rounded hover:bg-white/10 transition text-sm font-medium">AI Quiz</Link>
        <Link href="/subjects" className="text-white px-3 py-1 rounded hover:bg-white/10 transition text-sm font-medium">Subjects</Link>
        <Link href="/quizzes" className="text-white px-3 py-1 rounded hover:bg-white/10 transition text-sm font-medium">My Quizzes</Link>
        <Link href="/classes" className="text-white px-3 py-1 rounded hover:bg-white/10 transition text-sm font-medium">Classes</Link>
        <Link href="/quiz-records" className="text-white px-3 py-1 rounded hover:bg-white/10 transition text-sm font-medium">Records</Link>
        <Link href="/analytics" className="text-white px-3 py-1 rounded hover:bg-white/10 transition text-sm font-medium">Analytics</Link>
        <Link href="/friends" className="text-white px-3 py-1 rounded hover:bg-white/10 transition text-sm font-medium">Friends</Link>
      </div>
      {/* Profile & Actions */}
      <div className="flex items-center gap-3">
        <span className="text-white text-sm font-semibold">{getDisplayName()}</span>
        <button onClick={handleLogout} className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-1 rounded transition text-sm font-medium">Logout</button>
      </div>
      {/* Mobile NavBar: Left-side drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[9998]">
          <div className="absolute inset-0 bg-black/40" onClick={closeMenu} />
          <div className="fixed left-0 top-0 h-full w-2/3 max-w-xs bg-gradient-to-br from-[#181824] to-[#3a2a5d] shadow-2xl flex flex-col justify-between z-[9999]">
            {/* Top: Profile & Back Button */}
            <div className="flex flex-col gap-4 p-6 border-b border-white/10">
              <button onClick={closeMenu} className="text-white text-lg font-bold mb-2 flex items-center gap-2"><span>←</span> Back</button>
              <div className="flex items-center gap-3">
                {userProfile?.profilePicture ? (
                  <img src={userProfile.profilePicture} alt="Profile" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">{getDisplayName().charAt(0).toUpperCase()}</div>
                )}
                <div className="flex flex-col">
                  <span className="font-semibold text-white text-base">{getDisplayName()}</span>
                  <span className="text-purple-200 text-xs">Welcome!</span>
                </div>
              </div>
            </div>
            {/* Middle: Navigation Links */}
            <div className="flex flex-col gap-2 px-6 py-4 flex-1 overflow-y-auto">
              <Link href="/" className="text-white px-3 py-2 rounded hover:bg-white/10 transition text-base font-medium" onClick={closeMenu}>Home</Link>
              <Link href="/create" className="text-white px-3 py-2 rounded hover:bg-white/10 transition text-base font-medium" onClick={closeMenu}>Create</Link>
              <Link href="/ai-quiz" className="text-white px-3 py-2 rounded hover:bg-white/10 transition text-base font-medium" onClick={closeMenu}>AI Quiz</Link>
              <Link href="/subjects" className="text-white px-3 py-2 rounded hover:bg-white/10 transition text-base font-medium" onClick={closeMenu}>Subjects</Link>
              <Link href="/quizzes" className="text-white px-3 py-2 rounded hover:bg-white/10 transition text-base font-medium" onClick={closeMenu}>My Quizzes</Link>
              <Link href="/classes" className="text-white px-3 py-2 rounded hover:bg-white/10 transition text-base font-medium" onClick={closeMenu}>Classes</Link>
              <Link href="/quiz-records" className="text-white px-3 py-2 rounded hover:bg-white/10 transition text-base font-medium" onClick={closeMenu}>Records</Link>
              <Link href="/analytics" className="text-white px-3 py-2 rounded hover:bg-white/10 transition text-base font-medium" onClick={closeMenu}>Analytics</Link>
              <Link href="/friends" className="text-white px-3 py-2 rounded hover:bg-white/10 transition text-base font-medium" onClick={closeMenu}>Friends</Link>
            </div>
            {/* Bottom: Logout */}
            <div className="p-6 border-t border-white/10">
              <button onClick={handleLogout} className="bg-pink-500 hover:bg-pink-600 text-white w-full px-3 py-2 rounded transition text-base font-medium">Logout</button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default NavBar;
