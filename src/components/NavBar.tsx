"use client";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from '@/contexts/AuthContext';
import { uploadProfilePicture, deleteProfilePicture } from '@/lib/firestore';

export default function NavBar() {
  const { user, userProfile, logout, refreshUserProfile } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      console.error('Error logging out:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setShowProfileMenu(false);
  };

  // Profile picture upload handlers
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      await uploadProfilePicture(user.uid, file);
      // Refresh the user profile to show the new picture
      await refreshUserProfile();
      setShowProfileMenu(false);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!user || !userProfile?.profilePicture) return;

    try {
      await deleteProfilePicture(user.uid, userProfile.profilePicture);
      // Refresh the user profile to remove the picture
      await refreshUserProfile();
      setShowProfileMenu(false);
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      alert('Failed to delete profile picture');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setShowProfileMenu(false);
      }
    };

    if (isMenuOpen || showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen, showProfileMenu]);

  return (
    <nav className="relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl px-8 py-4 min-w-fit" ref={menuRef}>
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center justify-between gap-6">
        {/* User Profile Section */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {userProfile?.profilePicture ? (
              <div 
                className="w-10 h-10 rounded-full overflow-hidden shadow-lg cursor-pointer hover:ring-2 hover:ring-purple-300 transition-all"
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
                className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg cursor-pointer hover:ring-2 hover:ring-purple-300 transition-all"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                {getDisplayName().charAt(0).toUpperCase()}
              </div>
            )}
            
            {/* Profile Picture Menu */}
            {showProfileMenu && (
              <div className="absolute top-12 left-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2 shadow-xl z-50 min-w-[200px]">
                <button
                  onClick={triggerFileInput}
                  disabled={isUploading}
                  className="w-full px-3 py-2 text-left text-white hover:bg-white/10 rounded-lg transition-all disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : userProfile?.profilePicture ? 'Change Picture' : 'Upload Picture'}
                </button>
                {userProfile?.profilePicture && (
                  <button
                    onClick={handleDeleteProfilePicture}
                    className="w-full px-3 py-2 text-left text-red-300 hover:bg-red-500/20 rounded-lg transition-all"
                  >
                    Remove Picture
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleProfilePictureUpload}
            className="hidden"
          />
          
          <div className="flex flex-col">
            <span className="font-semibold text-white text-lg">
              {getDisplayName()}
            </span>
            <span className="text-purple-200 text-sm">
              Welcome back!
            </span>
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
        </div>

        {/* Right Section - Theme Toggle & Logout */}
        <div className="flex items-center gap-4">
          <div className="bg-white/10 rounded-xl p-2">
            <ThemeToggle />
          </div>
          <button 
            onClick={handleLogout} 
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 transition-all duration-200 font-medium shadow-lg hover:scale-105 flex items-center gap-2"
          >
            Logout
          </button>
        </div>
      </div>

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
              <ThemeToggle />
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
          <div className="absolute top-full right-0 mt-3 w-64 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 py-3 z-50 animate-fade-in">
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
        )}
      </div>
    </nav>
  );
}
