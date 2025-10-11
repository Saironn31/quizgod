"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, getFriendRequests, acceptFriendRequest, declineFriendRequest, removeFriend } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import PrivateChat from '@/components/PrivateChat';
import SideNav from '@/components/SideNav';
import FriendRequestForm from '@/components/AddFriendForm';

const FriendsPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [friends, setFriends] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<any | null>(null);
  // ChatOverlay trigger state
  const [chatOverlayFriend, setChatOverlayFriend] = useState<any | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [requestProfiles, setRequestProfiles] = useState<{ [uid: string]: any }>({});
  const [requestsLoading, setRequestsLoading] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, async (docSnap) => {
      const data = docSnap.data();
      console.log('Firestore friends listener triggered for UID:', user?.uid, 'Friends:', data?.friends);
      if (!data?.friends || !data.friends.length) {
        setFriends([]);
        setLoading(false);
        return;
      }
      const profiles = await Promise.all(
        data.friends.map(async (uid: string) => {
          const profile = await getUserProfile(uid);
          return profile;
        })
      );
      setFriends(profiles.filter(Boolean));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user?.uid) return;
      setRequestsLoading(true);
      const requests = await getFriendRequests(user.uid);
      setFriendRequests(requests);
      setRequestsLoading(false);
    };
    fetchRequests();
  }, [user]);

  // Fetch sender profiles for friend requests
  useEffect(() => {
    const fetchProfiles = async () => {
      const uids = friendRequests
        .filter(req => req.type === 'received')
        .map(req => req.senderUid);
      const uniqueUids = Array.from(new Set(uids));
      const profiles: { [uid: string]: any } = {};
      await Promise.all(uniqueUids.map(async uid => {
        const profile = await getUserProfile(uid);
        if (profile) profiles[uid] = profile;
      }));
      setRequestProfiles(profiles);
    };
    if (friendRequests.length > 0) fetchProfiles();
  }, [friendRequests]);

  return (
    <div className="min-h-screen bg-slate-950">
      <SideNav />
      <div className="md:ml-64 min-h-screen p-4 md:p-8">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-500/5 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-violet-500/5 rounded-full filter blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
        </div>
        <div className="relative z-10 mb-8">
          <div className="glass-card rounded-3xl p-8 md:p-12 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-2 border-white/10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl md:text-6xl font-black mb-3">
                  <span className="text-white">Friends</span>
                </h1>
                <p className="text-slate-300 text-lg">Connect and chat with your friends</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="glass-card rounded-3xl p-6 md:col-span-2 animate-slide-up">
            <div className="flex justify-center mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search friends by name, username, or email"
                className="px-3 py-2 rounded-xl border border-purple-300 bg-white/20 text-white w-full max-w-md"
              />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Your Friends</h1>
            <p className="text-purple-200 mb-4">Connect and chat with your friends</p>
            <div className="flex justify-center mb-4">
              <FriendRequestForm />
            </div>
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-white mb-2">Friend Requests</h2>
              {requestsLoading && friendRequests.length === 0 ? (
                <p className="text-purple-200">Loading requests...</p>
              ) : friendRequests.length === 0 ? (
                <p className="text-purple-400">No pending requests</p>
              ) : (
                <div className="flex flex-col gap-3 items-center">
                  {friendRequests.map(req => (
                    <div key={req.id} className="bg-white/10 rounded-lg border border-purple-400/30 p-4 w-full max-w-md flex flex-col items-center">
                      <div className="text-white font-medium mb-1">
                        {req.type === 'received' ? (
                          <>
                            From: {requestProfiles[req.senderUid]?.username ? (
                              <span
                                className="underline cursor-pointer text-purple-200 hover:text-purple-400"
                                onClick={() => { setSelectedFriend(requestProfiles[req.senderUid]); setShowProfileModal(true); }}
                              >
                                {requestProfiles[req.senderUid].username}
                              </span>
                            ) : req.senderUid}
                          </>
                        ) : (
                          <>
                            To: {requestProfiles[req.receiverUid]?.username ? requestProfiles[req.receiverUid].username : req.receiverUid}
                          </>
                        )}
                      </div>
                      <div className="text-purple-200 text-xs mb-2">Status: {req.status}</div>
                      {req.type === 'received' && req.status === 'pending' && (
                        <div className="flex gap-2">
                          <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={async () => { await acceptFriendRequest(req.id); window.location.reload(); }}>Accept</button>
                          <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={async () => { await declineFriendRequest(req.id); window.location.reload(); }}>Decline</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
              {friends.length === 0 && !loading && (
                <div className="text-white/80 text-center py-8 bg-gradient-to-br from-purple-700/30 to-blue-700/30 rounded-xl border border-white/10 shadow-lg">
                  No friends yet.<br />Add friends from your profile menu!
                </div>
              )}
              {friends
                .filter(friend => {
                  const term = searchTerm.toLowerCase();
                  return (
                    friend.name?.toLowerCase().includes(term) ||
                    friend.username?.toLowerCase().includes(term) ||
                    friend.email?.toLowerCase().includes(term)
                  );
                })
                .map(friend => (
                  <div key={friend.uid} className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg border border-blue-200 dark:border-blue-700 p-6 flex flex-col items-center gap-2 shadow-xl transition-all hover:scale-[1.03]">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-3xl font-bold mb-2 shadow-lg">
                    {friend.name?.charAt(0).toUpperCase() || friend.username?.charAt(0).toUpperCase() || friend.email?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="text-lg font-semibold text-gray-800 dark:text-white text-center cursor-pointer underline" onClick={() => { setSelectedFriend(friend); setShowProfileModal(true); }}>{friend.name || friend.username || friend.email}</div>
                  <div className="text-xs text-purple-600 dark:text-purple-200 mb-2 text-center">{friend.username || friend.email}</div>
                  <button
                    className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium shadow hover:from-green-600 hover:to-emerald-600 transition-all mt-2"
                    onClick={() => setChatOverlayFriend(friend)}
                  >
                    💬 Chat
                  </button>
                  <button
                    className="px-2 py-1 text-xs bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-medium shadow hover:from-red-600 hover:to-pink-600 transition-all mt-2"
                    onClick={async () => {
                      if (!user?.uid) return;
                      await removeFriend(user.uid, friend.uid);
                      setFriends(prev => prev.filter(f => f.uid !== friend.uid));
                    }}
                  >
                    ❌ Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* ChatOverlay for friend chat at bottom right */}
        {chatOverlayFriend && (
          <div className="fixed bottom-4 right-4 z-50 w-80 max-w-full bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-purple-400 flex flex-col">
            <div className="flex justify-between items-center px-4 py-2 border-b border-purple-300 bg-purple-700 text-white rounded-t-xl">
              <span className="font-bold">Chat with {chatOverlayFriend.name || chatOverlayFriend.username || chatOverlayFriend.email}</span>
              <button className="text-lg" onClick={() => setChatOverlayFriend(null)}>✖</button>
            </div>
            <div className="p-2">
              <PrivateChat friendUid={chatOverlayFriend.uid} friendName={chatOverlayFriend.name || chatOverlayFriend.username || chatOverlayFriend.email} />
            </div>
          </div>
        )}
        {/* Profile modal for selected friend */}
        {showProfileModal && selectedFriend && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-purple-400">
              <h2 className="text-2xl font-bold mb-2 text-purple-700 dark:text-purple-300 text-center">Friend Profile</h2>
              <div className="mb-4 text-center">
                <div className="text-lg font-semibold text-gray-800 dark:text-white">{selectedFriend.name || selectedFriend.username || selectedFriend.email}</div>
                <div className="text-xs text-purple-600 dark:text-purple-200 mb-2">{selectedFriend.username || selectedFriend.email}</div>
              </div>
              <div className="mb-4">
                <div className="font-medium text-gray-700 dark:text-gray-200">Bio:</div>
                <div className="text-gray-600 dark:text-gray-300">{selectedFriend.bio || 'No bio available.'}</div>
              </div>
              <div className="mb-4">
                <div className="font-medium text-gray-700 dark:text-gray-200">Recent Activity:</div>
                <div className="text-gray-600 dark:text-gray-300">(Coming soon)</div>
              </div>
              <div className="mb-4">
                <div className="font-medium text-gray-700 dark:text-gray-200">Shared Quizzes:</div>
                <div className="text-gray-600 dark:text-gray-300">(Coming soon)</div>
              </div>
              <div className="flex justify-center">
                <button className="mt-2 px-6 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-xl font-medium shadow hover:bg-purple-800/80 transition-all" onClick={() => setShowProfileModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;
