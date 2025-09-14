"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile } from '@/lib/firestore';
import PrivateChat from '@/components/PrivateChat';

const FriendsPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!userProfile?.friends || !userProfile.friends.length) return;
      setLoading(true);
      const profiles = await Promise.all(
        userProfile.friends.map(async (uid: string) => {
          const profile = await getUserProfile(uid);
          return profile;
        })
      );
      setFriends(profiles.filter(Boolean));
      setLoading(false);
    };
    fetchFriends();
  }, [userProfile]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-white">👥 Your Friends</h1>
      {loading && <div className="text-white">Loading friends...</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {friends.length === 0 && !loading && (
          <div className="text-white/80 text-center py-8 bg-gradient-to-br from-purple-700/30 to-blue-700/30 rounded-xl border border-white/10 shadow-lg">
            No friends yet.<br />Add friends from your profile menu!
          </div>
        )}
        {friends.map(friend => (
          <div key={friend.uid} className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-2xl p-6 border border-white/10 shadow-xl flex flex-col items-center gap-2 transition-all hover:scale-[1.03]">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-3xl font-bold mb-2 shadow-lg">
              {friend.name?.charAt(0).toUpperCase() || friend.username?.charAt(0).toUpperCase() || friend.email?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="text-lg font-semibold text-white text-center">{friend.name || friend.username || friend.email}</div>
            <div className="text-xs text-purple-200 mb-2 text-center">{friend.username || friend.email}</div>
            <button
              className="px-5 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-medium shadow hover:bg-green-600/80 transition-all mt-2"
              onClick={() => setSelectedFriend(friend)}
            >
              💬 Chat
            </button>
          </div>
        ))}
      </div>
      {selectedFriend && (
        <div className="mt-8 bg-white/10 rounded-2xl p-6 border border-white/20 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-white text-center">💬 Chat with {selectedFriend.name || selectedFriend.username || selectedFriend.email}</h2>
          <PrivateChat friendUid={selectedFriend.uid} friendName={selectedFriend.name || selectedFriend.username || selectedFriend.email} />
          <div className="flex justify-center">
            <button className="mt-6 px-6 py-2 bg-gradient-to-r from-gray-700 to-purple-700 text-white rounded-xl font-medium shadow hover:bg-gray-800/80 transition-all" onClick={() => setSelectedFriend(null)}>Close Chat</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendsPage;
