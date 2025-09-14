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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {friends.length === 0 && !loading && (
          <div className="text-white">No friends yet. Add friends from your profile menu!</div>
        )}
        {friends.map(friend => (
          <div key={friend.uid} className="bg-white/10 rounded-xl p-4 border border-white/20 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold mb-2">
              {friend.profilePicture ? (
                <img src={friend.profilePicture} alt="Profile" className="w-full h-full object-cover rounded-full" />
              ) : (
                friend.name?.charAt(0).toUpperCase() || '?' 
              )}
            </div>
            <div className="text-lg font-semibold text-white">{friend.name || friend.username || friend.email}</div>
            <div className="text-xs text-purple-200 mb-2">{friend.username || friend.email}</div>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded mt-2"
              onClick={() => setSelectedFriend(friend)}
            >
              Chat
            </button>
          </div>
        ))}
      </div>
      {selectedFriend && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 text-white">💬 Chat with {selectedFriend.name || selectedFriend.username || selectedFriend.email}</h2>
          <PrivateChat friendUid={selectedFriend.uid} friendName={selectedFriend.name || selectedFriend.username || selectedFriend.email} />
          <button className="mt-4 px-4 py-2 bg-gray-600 text-white rounded" onClick={() => setSelectedFriend(null)}>Close Chat</button>
        </div>
      )}
    </div>
  );
};

export default FriendsPage;
