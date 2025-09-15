"use client";
import AddFriendForm from './AddFriendForm';
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { getFriendRequests } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
// import { uploadProfilePicture, deleteProfilePicture } from '@/lib/firestore';
import ChangeNameForm from './ChangeNameForm';
// removed duplicate useState import


const NavBar: React.FC = () => {
  // Handler for deleting profile picture
  // Removed profile picture delete handler

  // Handler for uploading profile picture
  // Removed profile picture upload handler

  // Handler to close mobile menu
  const closeMenu = () => {
    setIsMenuOpen(false);
  };
  // All hooks and handlers inside function
  const { user, userProfile, logout, refreshUserProfile } = useAuth();
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

  // Removed triggerFileInput logic

  // (Removed duplicate useEffect outside function body)
  return (
    <nav className="relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl px-8 py-4 min-w-fit" ref={menuRef}>
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center justify-between gap-6">
        {/* User Profile Section */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {/* Removed profile picture display and upload UI */}
            
            {/* Profile Picture Menu */}
            {/* Removed profile picture menu UI */}
          
          {/* Removed file input for profile picture */}
          
          <div className="flex flex-col">
            <span className="font-semibold text-white text-lg">
              {getDisplayName()}
            </span>
            <span className="text-purple-200 text-sm">
              Welcome back!
            </span>
            <button
              className="mt-2 px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-xs font-medium shadow hover:bg-purple-700/80 transition-all"
              onClick={() => setShowProfileModal(true)}
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-3">
          <Link 
            href="/" 
            className="px-5 py-2 rounded-xl text-blue-300 hover:bg-blue-500/20 transition-all duration-200 font-medium flex items-center gap-2 hover:scale-105"
          >
            Home
          </Link>
          <Link 
            href="/create" 
            className="px-5 py-2 rounded-xl text-white hover:bg-white/20 transition-all duration-200 font-medium flex items-center gap-2 hover:scale-105"
          >
            Create Quiz
          </Link>
          <Link 
            href="/ai-quiz" 
            className="px-5 py-2 rounded-xl text-yellow-300 hover:bg-yellow-500/20 transition-all duration-200 font-medium flex items-center gap-2 hover:scale-105"
          >
            AI Quiz
          </Link>
          <Link 
            href="/subjects" 
            className="px-5 py-2 rounded-xl text-white hover:bg-white/20 transition-all duration-200 font-medium flex items-center gap-2 hover:scale-105"
          >
            Subjects
          </Link>
          <Link 
            href="/quizzes" 
            className="px-5 py-2 rounded-xl text-white hover:bg-white/20 transition-all duration-200 font-medium flex items-center gap-2 hover:scale-105"
          >
            My Quizzes
          </Link>
          <Link 
            href="/classes" 
            className="px-5 py-2 rounded-xl text-green-300 hover:bg-green-500/20 transition-all duration-200 font-medium flex items-center gap-2 hover:scale-105"
          >
            Classes
          </Link>
          <Link 
            href="/friends" 
            className="px-5 py-2 rounded-xl text-pink-300 hover:bg-pink-500/20 transition-all duration-200 font-medium flex items-center gap-2 hover:scale-105 relative"
          >
            Friends
            {pendingRequests > 0 && (
              <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold animate-pulse">
                {pendingRequests}
              </span>
            )}
          </Link>
        </div>

        {/* Right Section - Theme Toggle & Logout */}
        <div className="flex items-center gap-4">
          <button 
            onClick={handleLogout} 
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 transition-all duration-200 font-medium shadow-lg hover:scale-105 flex items-center gap-2"
          >
            Logout
          </button>
        </div>
      </div> {/* END desktop nav main flex container */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-purple-400">
            <h2 className="text-2xl font-bold mb-2 text-purple-700 dark:text-purple-300 text-center">Edit Profile</h2>
            <form className="flex flex-col gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Name</label>
              <input className="px-3 py-2 rounded-xl border border-purple-300 bg-white/20 text-black dark:text-white" defaultValue={userProfile?.name || ''} />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
              <input className="px-3 py-2 rounded-xl border border-purple-300 bg-white/20 text-black dark:text-white" defaultValue={userProfile?.email || ''} />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Bio</label>
              <textarea className="px-3 py-2 rounded-xl border border-purple-300 bg-white/20 text-black dark:text-white" defaultValue={(userProfile as any)?.bio || ''} />
              <div className="flex justify-center mt-4">
                <button type="button" className="px-6 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-xl font-medium shadow hover:bg-purple-800/80 transition-all" onClick={() => setShowProfileModal(false)}>Close</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div> {/* END nav main container */}

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
