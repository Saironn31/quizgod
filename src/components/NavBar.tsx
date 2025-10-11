"use client";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getFriendRequests, subscribeToFriendRequests, subscribeToSentFriendRequests, getUserQuizRecords, acceptFriendRequest, declineFriendRequest, getUserProfile } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
// import { uploadProfilePicture, deleteProfilePicture } from '@/lib/firestore';

interface Notification {
  id: string;
  text: string;
  link: string;
  dismissible?: boolean;
}

const NavBar: React.FC = () => {
  // Remove duplicate declaration

  // Removed misplaced effect. Only one effect exists after user declaration.
  // All hooks and handlers inside function
  const { user, userProfile, logout, refreshUserProfile } = useAuth();
  const [recentRecords, setRecentRecords] = useState<any[]>([]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  useEffect(() => {
    if (!user?.uid) return;
    
    const updateNotifications = async (receivedRequests: any[] = [], sentRequests: any[] = []) => {
      const notifArr: Notification[] = [];
      
      // Friend request notifications (received) - include details
      if (receivedRequests.length > 0) {
        for (const req of receivedRequests) {
          try {
            const profile = await getUserProfile(req.senderUid);
            notifArr.push({
              id: `friend_${req.id}`,
              text: `${profile?.name || profile?.username || req.senderUid} sent you a friend request`,
              link: '/friends',
              dismissible: false
            });
          } catch (e) {
            notifArr.push({
              id: `friend_${req.id}`,
              text: `You have a new friend request`,
              link: '/friends',
              dismissible: false
            });
          }
        }
      }
      
      // Accepted friend requests (sent requests that are accepted)
      const acceptedCount = sentRequests.filter(r => r.status === 'accepted').length;
      if (acceptedCount > 0) {
        notifArr.push({ 
          id: 'friend-accepted', 
          text: `${acceptedCount} of your friend request${acceptedCount > 1 ? 's were' : ' was'} accepted!`, 
          link: '/friends',
          dismissible: true
        });
      }
      
      // Quiz played notifications (keep polling for now, could be optimized later)
      const res = await import('@/lib/firestore');
      const playCounts = await res.getQuizPlayCountsForUser(user.uid);
      Object.entries(playCounts).forEach(([quizId, count]) => {
        if (count > 0) {
          notifArr.push({ id: `quiz-${quizId}`, text: `Your quiz was played by ${count} user${count > 1 ? 's' : ''}.`, link: '/quiz-records', dismissible: true });
        }
      });
      
      setNotifications(notifArr);
    };

    // Subscribe to received friend requests
    const unsubscribeReceived = subscribeToFriendRequests(user.uid, (requests) => {
      // We need both received and sent to update properly
      // For now, just update with received
      updateNotifications(requests, []);
    });

    // Subscribe to sent friend requests
    const unsubscribeSent = subscribeToSentFriendRequests(user.uid, (requests) => {
      updateNotifications([], requests);
    });

    // Initial load
    updateNotifications();

    return () => {
      unsubscribeReceived();
      unsubscribeSent();
    };
  }, [user?.uid]);
  // Handler for deleting profile picture
  // Removed profile picture delete handler

  // Handler for uploading profile picture
  // Removed profile picture upload handler

  // Handler to close mobile menu
  // Place recent activity effect after all hooks and user declaration
  useEffect(() => {
    const fetchRecentRecords = async () => {
      if (!user?.uid) return;
      const records = await getUserQuizRecords(user.uid);
      // Sort by timestamp descending
      const sorted = records.sort((a, b) => {
        const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
        const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
        return bTime - aTime;
      }).slice(0, 5);
      // Fetch quiz details for each record
      const withDetails = await Promise.all(sorted.map(async (rec) => {
        let quizTitle = '';
        let subject = rec.subject || '';
        if (rec.quizId) {
          const quiz = await import('@/lib/firestore').then(mod => mod.getQuizById(rec.quizId));
          if (quiz) {
            quizTitle = quiz.title || '';
            subject = subject || quiz.subject || '';
          }
        }
        return {
          ...rec,
          quizTitle,
          subject,
        };
      }));
      setRecentRecords(withDetails);
    };
    fetchRecentRecords();
  }, [user?.uid]);
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
      if (router) {
        router.push('/'); // Redirect to home page after logout
      }
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
    <nav className="bg-gradient-to-r from-[#181824] to-[#3a2a5d] px-6 py-3 sm:py-4 flex items-center justify-between rounded-xl shadow-lg border border-white/10 max-w-full overflow-x-auto">
      {/* Logo and Brand */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* On very small screens show compact emoji-only brand */}
        <span className="text-pink-300 text-2xl sm:text-3xl font-bold hidden xs:inline-flex">🧠 QuizGod</span>
        <span className="text-pink-300 text-2xl sm:text-3xl font-bold inline-flex xs:hidden">🧠</span>
      </div>
      {/* Navigation Links */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/" className="text-white px-3 py-2 rounded hover:bg-white/10 transition text-sm font-medium whitespace-nowrap">Home</Link>
        <Link href="/quiz-creator" className="text-white px-3 py-2 rounded hover:bg-white/10 transition text-sm font-medium whitespace-nowrap">Create Quiz</Link>
        <Link href="/subjects" className="text-white px-3 py-2 rounded hover:bg-white/10 transition text-sm font-medium whitespace-nowrap">Subjects</Link>
        <Link href="/quizzes" className="text-white px-3 py-2 rounded hover:bg-white/10 transition text-sm font-medium whitespace-nowrap">My Quizzes</Link>
        <Link href="/classes" className="text-white px-3 py-2 rounded hover:bg-white/10 transition text-sm font-medium whitespace-nowrap">Classes</Link>
        <Link href="/quiz-records" className="text-white px-3 py-2 rounded hover:bg-white/10 transition text-sm font-medium whitespace-nowrap">Records</Link>
        <Link href="/analytics" className="text-white px-3 py-2 rounded hover:bg-white/10 transition text-sm font-medium whitespace-nowrap">Analytics</Link>
        <Link href="/friends" className="text-white px-3 py-2 rounded hover:bg-white/10 transition text-sm font-medium whitespace-nowrap">Friends</Link>
      </div>
      {/* Profile & Actions */}
  <div className="flex items-center gap-3 flex-shrink-0">
        {/* Recent Activity Panel */}
        <div className="hidden md:flex flex-col items-end mr-4">
          <div className="bg-white/10 rounded-xl p-3 shadow border border-purple-300 min-w-[220px]">
            <h4 className="text-purple-700 dark:text-purple-300 font-bold text-sm mb-2">Recent Activity</h4>
            {recentRecords.length === 0 ? (
              <div className="text-purple-400 text-xs">No recent activity.</div>
            ) : (
              <ul className="space-y-1">
                {recentRecords.map(rec => (
                  <li key={rec.id} className="text-xs text-purple-900 dark:text-purple-200 flex flex-col border-b border-purple-100 last:border-b-0 pb-1">
                    <span className="font-semibold">{rec.quizTitle || 'Quiz'}</span>
                    <span>{rec.timestamp ? (rec.timestamp instanceof Date ? rec.timestamp.toLocaleDateString() : new Date(rec.timestamp).toLocaleDateString()) : 'N/A'}</span>
                    <span className="font-bold text-green-600 dark:text-green-400">{rec.score}/{rec.percentage ? Math.round(rec.score / (rec.percentage / 100)) : '?'}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {/* Notification Button (Desktop & Mobile) */}
        <button
          className="relative px-3 py-2 rounded-xl hover:bg-white/20 transition-all duration-200"
          onClick={() => setShowNotifications(!showNotifications)}
          aria-label="Notifications"
        >
          <svg className="w-6 h-6 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1 py-0 font-bold animate-pulse">
              {notifications.length}
            </span>
          )}
        </button>
        {showNotifications && (
          // On small screens, make notification panel centered and wider
          <div className="absolute right-8 top-24 z-[2147483647] bg-white rounded-xl shadow-2xl border border-yellow-300 min-w-[260px] max-w-xs p-4 text-gray-900 sm:right-8 sm:top-24 xs:left-1/2 xs:transform xs:-translate-x-1/2 xs:w-[90%]">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg mb-2 text-yellow-700">Notifications</h3>
              <button onClick={() => { setNotifications([]); setShowNotifications(false); }} className="text-gray-500 hover:text-gray-700 ml-2">✕</button>
            </div>
            {notifications.length === 0 ? (
              <div className="text-gray-500">No notifications.</div>
            ) : (
              // Limit visible height to ~3 items and allow scrolling for overflow
              <div className="max-h-[220px] overflow-auto">
                <ul className="space-y-2">
                  {notifications.map(n => (
                    <li
                      key={n.id}
                      className="bg-yellow-100 rounded px-3 py-2 text-sm transition relative flex items-start justify-between"
                    >
                      <div className="flex-1 mr-2">
                        {n.id.startsWith('friend_') ? (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1">{n.text}</div>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer"
                            onClick={() => {
                              if (n.link && router) {
                                router.push(n.link);
                                setShowNotifications(false);
                              }
                            }}
                          >
                            {n.text}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {n.id.startsWith('friend_') ? (
                          <>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                const reqId = n.id.replace('friend_', '');
                                try {
                                  await acceptFriendRequest(reqId);
                                  // remove notification and refresh pending count
                                  setNotifications(prev => prev.filter(notif => notif.id !== n.id));
                                  dismissNotification(n.id);
                                  if (user?.uid) {
                                    const requests = await getFriendRequests(user.uid);
                                    setPendingRequests(requests.filter(r => r.type === 'received' && r.status === 'pending').length);
                                  }
                                } catch (err) {
                                  console.error('Accept failed', err);
                                  alert('Failed to accept request');
                                }
                              }}
                              className="px-3 py-1 bg-green-600 text-white rounded"
                            >Accept</button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                const reqId = n.id.replace('friend_', '');
                                try {
                                  await declineFriendRequest(reqId);
                                  setNotifications(prev => prev.filter(notif => notif.id !== n.id));
                                  dismissNotification(n.id);
                                  if (user?.uid) {
                                    const requests = await getFriendRequests(user.uid);
                                    setPendingRequests(requests.filter(r => r.type === 'received' && r.status === 'pending').length);
                                  }
                                } catch (err) {
                                  console.error('Decline failed', err);
                                  alert('Failed to decline request');
                                }
                              }}
                              className="px-3 py-1 bg-red-600 text-white rounded"
                            >Decline</button>
                          </>
                        ) : (
                          // Show dismiss (X) only for dismissible notifications
                          n.dismissible !== false && (
                            <button onClick={(e) => { e.stopPropagation(); dismissNotification(n.id); }} className="text-gray-600 hover:text-gray-800">✕</button>
                          )
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              className="mt-4 w-full px-4 py-2 bg-yellow-400 text-white rounded hover:bg-yellow-500"
              onClick={() => setShowNotifications(false)}
            >Close</button>
          </div>
        )}
        <span className="text-white text-sm font-semibold hidden sm:inline">{getDisplayName()}</span>
        <button onClick={handleLogout} className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-2 rounded transition text-sm font-medium">Logout</button>
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
