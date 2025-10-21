"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, getFriendRequests, acceptFriendRequest, declineFriendRequest, removeFriend, getUserQuizRecords, getQuizById } from '@/lib/firestore';
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
  const [friendActivity, setFriendActivity] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

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
      const uids = [
        ...friendRequests.filter(req => req.type === 'received').map(req => req.senderUid),
        ...friendRequests.filter(req => req.type === 'sent').map(req => req.receiverUid)
      ];
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

  // Fetch friend activity when profile modal is opened
  useEffect(() => {
    const fetchActivity = async () => {
      if (!selectedFriend?.uid || !showProfileModal) return;
      setActivityLoading(true);
      try {
        const records = await getUserQuizRecords(selectedFriend.uid);
        const recentRecords = records.slice(0, 5);
        
        // Fetch quiz details for each record
        const activityData = await Promise.all(
          recentRecords.map(async (record: any) => {
            if (record.quizId) {
              const quiz = await getQuizById(record.quizId);
              return {
                ...record,
                quizTitle: (record as any).quizTitle || quiz?.title || 'Untitled Quiz',
                maxScore: quiz?.questions?.length || 1
              };
            }
            return {
              ...record,
              quizTitle: (record as any).quizTitle || 'Untitled Quiz',
              maxScore: 1
            };
          })
        );
        
        setFriendActivity(activityData);
      } catch (error) {
        console.error('Error fetching friend activity:', error);
      } finally {
        setActivityLoading(false);
      }
    };
    
    if (showProfileModal && selectedFriend) {
      fetchActivity();
    } else {
      setFriendActivity([]);
    }
  }, [selectedFriend, showProfileModal]);

  return (
    <div className="min-h-screen bg-slate-950">
      <SideNav />
      <div className="md:ml-64 min-h-screen p-6 md:p-12 pb-32 md:pb-12">
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
        {/* Friend Requests Section */}
        <div className="relative z-10 mb-8">
          <div className="glass-card rounded-3xl p-6 md:p-8 animate-slide-up">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Add Friends</h2>
              <p className="text-slate-300 text-base md:text-lg mb-6">Connect with friends to chat and compare quiz scores</p>
              <FriendRequestForm />
            </div>
            <div className="mt-8">
              <h3 className="text-xl md:text-2xl font-semibold text-white mb-6 text-center">Pending Requests</h3>
              {requestsLoading && friendRequests.length === 0 ? (
                <div className="flex items-center justify-center p-12 bg-white/5 rounded-2xl border border-white/10">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
                    <p className="text-purple-200 text-lg">Loading requests...</p>
                  </div>
                </div>
              ) : friendRequests.filter(r => r.status === 'pending').length === 0 ? (
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 rounded-2xl border border-slate-600/30 p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                    <span className="text-4xl">📭</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">All Caught Up!</h3>
                  <p className="text-slate-300 text-base mb-2">No pending friend requests at the moment</p>
                  <p className="text-slate-400 text-sm">Send requests using the form above</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                  {friendRequests.filter(r => r.status === 'pending').map(req => (
                    <div key={req.id} className="bg-white/10 rounded-2xl border border-purple-400/30 p-6 backdrop-blur-sm hover:bg-white/15 transition-all">
                      <div className="text-white font-medium mb-4 text-base md:text-lg text-center">
                        {req.type === 'received' ? (
                          <>
                            <span className="text-purple-300">Request from:</span><br/>
                            {requestProfiles[req.senderUid]?.username ? (
                              <span
                                className="underline cursor-pointer text-cyan-300 hover:text-cyan-400 font-semibold"
                                onClick={() => { setSelectedFriend(requestProfiles[req.senderUid]); setShowProfileModal(true); }}
                              >
                                {requestProfiles[req.senderUid].username}
                              </span>
                            ) : req.senderUid}
                          </>
                        ) : (
                          <>
                            <span className="text-purple-300">Sent to:</span><br/>
                            <span className="text-cyan-300 font-semibold">
                              {requestProfiles[req.receiverUid]?.username ? requestProfiles[req.receiverUid].username : req.receiverUid}
                            </span>
                          </>
                        )}
                      </div>
                      {req.type === 'received' && (
                        <div className="flex gap-3 mt-4">
                          <button 
                            className="flex-1 px-4 py-3 text-base bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all font-medium shadow-lg hover:shadow-xl" 
                            onClick={async () => { await acceptFriendRequest(req.id); window.location.reload(); }}
                          >
                            ✓ Accept
                          </button>
                          <button 
                            className="flex-1 px-4 py-3 text-base bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-medium shadow-lg hover:shadow-xl" 
                            onClick={async () => { await declineFriendRequest(req.id); window.location.reload(); }}
                          >
                            ✕ Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Friends List Section */}
        <div className="relative z-10 mb-8">
          <div className="glass-card rounded-3xl p-6 md:p-8 animate-slide-up">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Your Friends</h2>
              <p className="text-slate-300 text-base md:text-lg mb-6">Connect and chat with your friends</p>
              
              <div className="max-w-lg mx-auto">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search friends by name, username, or email"
                  className="px-6 py-4 text-base rounded-2xl border border-purple-300/50 bg-white/10 backdrop-blur-sm text-white w-full focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder-slate-400 transition-all"
                />
              </div>
            </div>
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-20 w-20 border-4 border-purple-500 border-t-transparent mb-6"></div>
                <p className="text-purple-200 text-xl font-medium">Loading friends...</p>
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                  <span className="text-5xl">👥</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">No Friends Yet</h3>
                <p className="text-slate-300 text-base mb-4">Start building your friend network!</p>
                <p className="text-slate-400 text-sm">Use the form above to send friend requests</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                    <div key={friend.uid} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl border border-white/20 p-6 flex flex-col items-center shadow-xl transition-all hover:scale-[1.02] hover:bg-white/15 group">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg group-hover:scale-110 transition-transform">
                        {friend.name?.charAt(0).toUpperCase() || friend.username?.charAt(0).toUpperCase() || friend.email?.charAt(0).toUpperCase() || '?'}
                      </div>
                      
                      <div 
                        className="text-lg font-semibold text-white text-center cursor-pointer hover:text-cyan-300 transition-colors mb-2 break-words max-w-full" 
                        onClick={() => { setSelectedFriend(friend); setShowProfileModal(true); }}
                      >
                        {friend.name || friend.username || friend.email}
                      </div>
                      
                      <div className="text-sm text-slate-300 mb-6 text-center truncate max-w-full">
                        @{friend.username || friend.email}
                      </div>
                      
                      <div className="flex flex-col gap-3 w-full mt-auto">
                        <button
                          className="px-5 py-3 text-base bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium shadow-lg hover:from-green-600 hover:to-emerald-600 transition-all hover:shadow-xl w-full"
                          onClick={() => setChatOverlayFriend(friend)}
                        >
                          💬 Chat
                        </button>
                        <button
                          className="px-4 py-2 text-sm bg-gradient-to-r from-red-500/80 to-pink-500/80 text-white rounded-lg font-medium shadow hover:from-red-600 hover:to-pink-600 transition-all w-full"
                          onClick={async () => {
                            if (!user?.uid) return;
                            if (confirm(`Remove ${friend.name || friend.username || friend.email} from your friends?`)) {
                              await removeFriend(user.uid, friend.uid);
                              setFriends(prev => prev.filter(f => f.uid !== friend.uid));
                            }
                          }}
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
        {/* ChatOverlay for friend chat at bottom right */}
        {chatOverlayFriend && (
          <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[500px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-purple-400/50 flex flex-col overflow-hidden animate-slide-up">
            <div className="flex items-center gap-4 px-6 py-4 border-b border-purple-300/30 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-2xl shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-lg font-bold shadow-lg shrink-0">
                {(chatOverlayFriend.name || chatOverlayFriend.username || chatOverlayFriend.email || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-base truncate">
                  {chatOverlayFriend.name || chatOverlayFriend.username || chatOverlayFriend.email}
                </div>
                <div className="text-purple-100 text-sm truncate">
                  @{chatOverlayFriend.username || 'user'}
                </div>
              </div>
              <button 
                className="text-2xl shrink-0 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors" 
                onClick={() => setChatOverlayFriend(null)}
              >
                ✖
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <PrivateChat friendUid={chatOverlayFriend.uid} friendName={chatOverlayFriend.name || chatOverlayFriend.username || chatOverlayFriend.email} />
            </div>
          </div>
        )}
        {/* Profile modal for selected friend */}
        {showProfileModal && selectedFriend && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-purple-400/50 max-h-[90vh] overflow-y-auto animate-scale-up">
              <h2 className="text-3xl font-bold mb-6 text-purple-700 dark:text-purple-300 text-center">Friend Profile</h2>
              <div className="mb-8 text-center">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-4xl font-bold mb-4 shadow-lg">
                  {selectedFriend.name?.charAt(0).toUpperCase() || selectedFriend.username?.charAt(0).toUpperCase() || selectedFriend.email?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{selectedFriend.name || selectedFriend.username || selectedFriend.email}</div>
                <div className="text-sm text-purple-600 dark:text-purple-200">@{selectedFriend.username || selectedFriend.email}</div>
              </div>
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 text-lg">Bio</h3>
                <div className="text-gray-600 dark:text-gray-300 text-base bg-gray-100/50 dark:bg-gray-800/50 rounded-xl p-4">
                  {selectedFriend.bio || 'No bio available.'}
                </div>
              </div>
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 text-lg">Recent Activity</h3>
                {activityLoading ? (
                  <div className="text-gray-600 dark:text-gray-300 text-sm">Loading...</div>
                ) : friendActivity.length > 0 ? (
                  <div className="space-y-2">
                    {friendActivity.map((activity, index) => (
                      <div key={index} className="bg-white/10 rounded-lg p-3 border border-purple-400/20">
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-medium text-white text-sm">{activity.quizTitle}</div>
                          <div className="text-xs font-bold text-cyan-400">{Math.round((activity.score / activity.maxScore) * 100)}%</div>
                        </div>
                        <div className="text-xs text-slate-400">
                          {activity.score}/{activity.maxScore} • {activity.timestamp?.toDate?.() ? new Date(activity.timestamp.toDate()).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-600 dark:text-gray-300 text-sm">No recent activity</div>
                )}
              </div>
              <div className="flex gap-4 mt-8">
                <button 
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-semibold shadow-lg hover:from-green-600 hover:to-emerald-600 transition-all hover:shadow-xl text-base" 
                  onClick={() => {
                    setShowProfileModal(false);
                    setChatOverlayFriend(selectedFriend);
                  }}
                >
                  💬 Start Chat
                </button>
                <button 
                  className="px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-2xl font-semibold shadow-lg hover:from-slate-700 hover:to-slate-800 transition-all text-base" 
                  onClick={() => setShowProfileModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;
