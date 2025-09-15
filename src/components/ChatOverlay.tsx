"use client";
import React, { useState } from 'react';
import PrivateChat from './PrivateChat';
import { useAuth } from '@/contexts/AuthContext';

const ChatOverlay: React.FC = () => {
  const { userProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [friend, setFriend] = useState<any | null>(null);

  // Example: show overlay if open and friend selected
  return (
    <>
      {open && friend && (
        <div className="fixed bottom-4 right-4 z-50 w-80 max-w-full bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-purple-400 flex flex-col">
          <div className="flex justify-between items-center px-4 py-2 border-b border-purple-300 bg-purple-700 text-white rounded-t-xl">
            <span className="font-bold">Chat with {friend.name || friend.username || friend.email}</span>
            <button className="text-lg" onClick={() => setOpen(false)}>✖</button>
          </div>
          <div className="p-2">
            <PrivateChat friendUid={friend.uid} friendName={friend.name || friend.username || friend.email} />
          </div>
        </div>
      )}
      {/* Example trigger button, you can replace with global state or context */}
      {!open && (
        <button className="fixed bottom-4 right-4 z-50 bg-purple-700 text-white px-4 py-2 rounded-full shadow-lg" onClick={() => { setOpen(true); setFriend(userProfile?.friends?.length ? { uid: userProfile.friends[0] } : null); }}>
          Open Chat
        </button>
      )}
    </>
  );
};

export default ChatOverlay;
