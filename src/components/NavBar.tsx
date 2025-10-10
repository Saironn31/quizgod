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

  // (Removed duplicate useEffect outside function body)
  return (
    <nav className="relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl px-4 py-2 min-w-fit" ref={menuRef}>
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center justify-between gap-6 w-full">
        {/* Navigation Links */}
        <div className="flex items-center gap-3 flex-1">
          <Link 
            href="/" 
              className="px-6 py-2 rounded-xl text-blue-700 bg-blue-100/30 hover:bg-blue-500/40 transition-all duration-200 font-bold flex items-center gap-2 hover:scale-105 border border-blue-600/30 text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Home
          </Link>
          <Link 
            href="/create" 
              className="px-6 py-2 rounded-xl text-white hover:bg-white/30 transition-all duration-200 font-bold flex items-center gap-2 hover:scale-105 border border-white/30"
          >
            Create Quiz
          </Link>
          <Link 
            href="/ai-quiz" 
              className="px-6 py-2 rounded-xl text-yellow-700 bg-yellow-100/30 hover:bg-yellow-500/40 transition-all duration-200 font-bold flex items-center gap-2 hover:scale-105 border border-yellow-500/30 text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            AI Quiz
          </Link>
          <Link 
            href="/subjects" 
              className="px-6 py-2 rounded-xl text-white hover:bg-white/30 transition-all duration-200 font-bold flex items-center gap-2 hover:scale-105 border border-white/30"
          >
            Subjects
          </Link>
          <Link 
            href="/quizzes" 
              className="px-6 py-2 rounded-xl text-white hover:bg-white/30 transition-all duration-200 font-bold flex items-center gap-2 hover:scale-105 border border-white/30"
          >
            My Quizzes
          </Link>
          <Link 
            href="/classes" 
              className="px-6 py-2 rounded-xl text-green-800 bg-green-100/30 hover:bg-green-500/40 transition-all duration-200 font-bold flex items-center gap-2 hover:scale-105 border border-green-700/30 text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            Classes
          </Link>
          <Link 
            href="/quiz-records" 
            className="px-6 py-2 rounded-xl text-purple-800 bg-purple-100/30 hover:bg-purple-500/40 transition-all duration-200 font-bold flex items-center gap-2 hover:scale-105 border border-purple-700/30 text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            Quiz Records
          </Link>
          <Link 
            href="/analytics" 
            className="px-6 py-2 rounded-xl text-teal-800 bg-teal-100/30 hover:bg-teal-500/40 transition-all duration-200 font-bold flex items-center gap-2 hover:scale-105 border border-teal-700/30 text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            Analytics
          </Link>
          <Link 
            href="/friends" 
            className="px-6 py-2 rounded-xl text-pink-700 bg-pink-100/30 hover:bg-pink-500/40 transition-all duration-200 font-bold flex items-center gap-2 hover:scale-105 border border-pink-600/30 text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 relative"
          >
            Friends
            {pendingRequests > 0 && (
              <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold animate-pulse">
                {pendingRequests}
              </span>
            )}
          </Link>
        </div>
        {/* Right Section - Profile, Notifications, Theme Toggle & Logout */}
        <div className="flex items-center gap-4">
          {/* Profile Details, Welcome, Name */}
            <div className="flex flex-col items-end text-right mr-2">
            <span className="font-semibold text-white text-lg">
              {getDisplayName()}
            </span>
            <span className="text-purple-200 text-sm">
              Welcome back!
            </span>
            {/* Quick Stats */}
            <div className="mt-1 text-xs text-teal-200 flex flex-col gap-1">
              <span className="flex items-center gap-2" title="Total quizzes you've taken">
                <FaCheckCircle className="text-green-400" aria-label="Quizzes Taken" />
                Quizzes Taken: <b>{userStats.quizzesTaken}</b>
              </span>
              <span className="flex items-center gap-2" title="Your average score across all quizzes">
                <FaChartBar className="text-blue-300" aria-label="Average Score" />
                Avg. Score: <b>{userStats.avgScore}</b>
              </span>
              <span className="flex items-center gap-2" title="Date of your last quiz attempt">
                <FaCalendarAlt className="text-yellow-300" aria-label="Last Quiz Date" />
                Last Quiz: <b>{userStats.lastQuizDate ? userStats.lastQuizDate.toLocaleDateString() : 'N/A'}</b>
              </span>
            </div>
            <a
              href="/profile"
              className="mt-2 px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-xs font-medium shadow hover:bg-purple-700/80 transition-all text-center"
            >
                <div className="flex gap-2 mt-2">
                  <a
                    href="/profile"
                    className="px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-xs font-medium shadow hover:bg-purple-700/80 transition-all text-center"
                  >
                    Profile
                  </a>
                  <button 
                    onClick={handleLogout} 
                    className="px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg text-xs font-medium shadow hover:from-red-600 hover:to-pink-600 transition-all text-center"
                  >
                    Logout
                  </button>
                </div>
              Profile
            </a>
          </div>
          {/* Notifications Icon */}
          <button
            className="relative px-3 py-2 rounded-xl hover:bg-white/20 transition-all duration-200"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <svg className="w-6 h-6 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {/* Notification badge if there are notifications */}
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold animate-pulse">
                {notifications.length}
              </span>
            )}
          </button>
          {/* Notifications Popup */}
          {showNotifications && (
            <div className="absolute right-8 top-24 z-[2147483647] bg-white rounded-xl shadow-2xl border border-yellow-300 min-w-[260px] max-w-xs p-4 text-gray-900">
              <h3 className="font-bold text-lg mb-2 text-yellow-700">Notifications</h3>
              {notifications.length === 0 ? (
                <div className="text-gray-500">No notifications.</div>
              ) : (
                <ul className="space-y-2">
                  {notifications.map(n => (
                    <li
                      key={n.id}
                      className="bg-yellow-100 rounded px-3 py-2 text-sm cursor-pointer hover:bg-yellow-200 transition"
                      onClick={() => {
                        if (n.link && router) {
                          router.push(n.link);
                          setShowNotifications(false);
                        }
                      }}
                    >
                      {n.text}
                    </li>
                  ))}
                </ul>
              )}
              <button
                className="mt-4 w-full px-4 py-2 bg-yellow-400 text-white rounded hover:bg-yellow-500"
                onClick={() => setShowNotifications(false)}
              >Close</button>
            </div>
          )}
          <button 
            onClick={handleLogout} 
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 transition-all duration-200 font-medium shadow-lg hover:scale-105 flex items-center gap-2"
          >
            Logout
          </button>
        </div>
      </div> {/* END desktop nav main flex container */}
      {/* Removed profile modal, now navigates to /profile page */}
  {/* END desktop nav main flex container */}

  {/* Mobile Navigation */}
      <div className="md:hidden">
        <div className="flex items-center justify-between">
          {/* Mobile User Profile */}
          <div className="flex items-center gap-3">
            <div className="relative">
              {userProfile?.profilePicture ? (
                <div 
                  className="w-8 h-8 rounded-full overflow-hidden shadow-lg cursor-pointer hover:ring-2 hover:ring-purple-300 transition-all"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                >
                  <img 
                    src={userProfile.profilePicture} 
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div 
                  className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg cursor-pointer hover:ring-2 hover:ring-purple-300 transition-all"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                >
                  {getDisplayName().charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-white text-sm">
                {getDisplayName()}
              </span>
              <span className="text-purple-200 text-xs">
                Welcome!
              </span>
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-2">
            <div className="bg-white/10 rounded-lg p-1">
            </div>
            {/* Hamburger Menu Button */}
            <button
              onClick={toggleMenu}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-105"
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <>
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998]" onClick={closeMenu} />
            <div className="fixed top-20 right-8 w-64 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 py-3 z-[9999] animate-fade-in">
              <div>
                <Link 
                  href="/" 
                  className="flex items-center gap-3 px-4 py-3 text-blue-300 hover:bg-blue-500/20 transition-all duration-200 font-medium rounded-xl mx-2"
                  onClick={closeMenu}
                >
                  Home
                </Link>
                <Link 
                  href="/create" 
                  className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/20 transition-all duration-200 font-medium rounded-xl mx-2"
                  onClick={closeMenu}
                >
                  Create Quiz
                </Link>
                <Link 
                  href="/ai-quiz" 
                  className="flex items-center gap-3 px-4 py-3 text-yellow-300 hover:bg-yellow-500/20 transition-all duration-200 font-medium rounded-xl mx-2"
                  onClick={closeMenu}
                >
                  AI Quiz
                </Link>
                <Link 
                  href="/subjects" 
                  className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/20 transition-all duration-200 font-medium rounded-xl mx-2"
                  onClick={closeMenu}
                >
                  Subjects
                </Link>
                <Link 
                  href="/quizzes" 
                  className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/20 transition-all duration-200 font-medium rounded-xl mx-2"
                  onClick={closeMenu}
                >
                  My Quizzes
                </Link>
                <Link 
                  href="/classes" 
                  className="flex items-center gap-3 px-4 py-3 text-green-300 hover:bg-green-500/20 transition-all duration-200 font-medium rounded-xl mx-2"
                  onClick={closeMenu}
                >
                  Classes
                </Link>
                <hr className="my-3 border-white/20 mx-4" />
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full text-left px-4 py-3 mx-2 text-white bg-gradient-to-r from-red-500/80 to-pink-500/80 hover:from-red-600 hover:to-pink-600 transition-all duration-200 font-medium rounded-xl shadow-lg"
                >
                  Logout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}

export default NavBar;
