"use client";
import React, { useState } from 'react';
import PrivateChat from './PrivateChat';
import ClassChat from './ClassChat';
import { useAuth } from '@/contexts/AuthContext';
import { FirebaseUser } from '@/lib/firestore';

const ChatOverlay: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [friend, setFriend] = useState<FirebaseUser | null>(null);
  const [friends, setFriends] = useState<FirebaseUser[]>([]);
  const [lastMessages, setLastMessages] = useState<{ [uid: string]: string }>({});
  const [chatMode, setChatMode] = useState<'private' | 'class'>('private');
  const [classId, setClassId] = useState<string | null>(null);
  const [className, setClassName] = useState<string>('');

  // Fetch friends and last messages when overlay opens
  React.useEffect(() => {
    if (!open || !user?.uid) return;
    // Fetch friends
    const fetchFriends = async () => {
      if (!userProfile?.friends || userProfile.friends.length === 0) {
        setFriends([]);
        return;
      }
      // Get friend profiles
      const profiles = await Promise.all(
        userProfile.friends.map(async (uid: string) => {
          const res = await import('@/lib/firestore');
          const profile = await res.getUserProfile(uid);
          return profile;
        })
      );
      setFriends(profiles.filter((profile): profile is FirebaseUser => profile !== null));
      // Get last messages for each friend
      const lastMsgs: { [uid: string]: string } = {};
      for (const f of profiles) {
        if (!f?.uid) continue;
        const res = await import('@/lib/firestore');
        const msgs = await res.getPrivateChatMessages(user.uid, f.uid);
        if (msgs.length > 0) {
          lastMsgs[f.uid] = msgs[msgs.length - 1].content;
        } else {
          lastMsgs[f.uid] = '';
        }
      }
      setLastMessages(lastMsgs);
    };
    fetchFriends();
  }, [open, user?.uid, userProfile?.friends]);

  // Overlay UI: show chat mode selector, friends list, or class chat
  return (
    <>
      {open && (
        <div className="fixed bottom-4 right-4 z-50 w-96 max-w-full bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-purple-400 flex flex-col">
          <div className="flex justify-between items-center px-4 py-2 border-b border-purple-300 bg-purple-700 text-white rounded-t-xl">
            <span className="font-bold">Messages</span>
            <div className="flex gap-2">
              <button
                className={`px-2 py-1 rounded ${chatMode === 'private' ? 'bg-purple-500 text-white' : 'bg-white text-purple-700'}`}
                onClick={() => setChatMode('private')}
              >Private</button>
              <button
                className={`px-2 py-1 rounded ${chatMode === 'class' ? 'bg-purple-500 text-white' : 'bg-white text-purple-700'}`}
                onClick={() => {
                  setChatMode('class');
                  // TODO: Implement class selection logic
                  setClassId(null);
                  setClassName('Class');
                }}
              >Class</button>
            </div>
            <button className="text-lg" onClick={() => setOpen(false)}>✖</button>
          </div>
          {chatMode === 'private' && !friend && (
            <div className="p-2 max-h-96 overflow-y-auto">
              {friends.length === 0 ? (
                <div className="text-center text-purple-400 py-8">No friends to chat with.</div>
              ) : (
                <ul className="space-y-2">
                  {friends.map(f => (
                    <li key={f.uid} className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900 cursor-pointer" onClick={() => setFriend(f)}>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                        {f.name?.charAt(0).toUpperCase() || f.username?.charAt(0).toUpperCase() || f.email?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 dark:text-white">{f.username || f.name || f.email}</div>
                        <div className="text-xs text-purple-600 dark:text-purple-200 truncate">
                          {lastMessages[f.uid]
                            ? `${f.username || f.name || f.email}: ${lastMessages[f.uid]}`
                            : 'No messages yet.'}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {chatMode === 'private' && friend && (
            <div className="flex flex-col h-96">
              <div className="flex items-center px-4 py-2 border-b border-purple-300 bg-purple-700 text-white rounded-t-xl">
                <button className="text-lg mr-2" onClick={() => setFriend(null)} aria-label="Back to friends">←</button>
                <span className="font-bold flex-1">Chat with {friend.name || friend.username || friend.email}</span>
                <button className="text-lg ml-2" onClick={() => setOpen(false)} aria-label="Close chat">✖</button>
              </div>
              <div className="p-2 flex-1">
                <PrivateChat friendUid={friend.uid} friendName={friend.name || friend.username || friend.email} />
              </div>
            </div>
          )}
          {chatMode === 'class' && classId && (
            <div className="flex flex-col h-96">
              <div className="flex items-center px-4 py-2 border-b border-purple-300 bg-purple-700 text-white rounded-t-xl">
                <span className="font-bold flex-1">Class Chat: {className}</span>
                <button className="text-lg ml-2" onClick={() => setOpen(false)} aria-label="Close chat">✖</button>
              </div>
              <div className="p-2 flex-1">
                {classId && <ClassChat classId={classId} />}
              </div>
            </div>
          )}
        </div>
      )}
      {!open && (
        <button className="fixed bottom-4 right-4 z-50 bg-purple-700 text-white px-4 py-2 rounded-full shadow-lg" onClick={() => setOpen(true)}>
          Open Chat
        </button>
      )}
    </>
  );
};

export default ChatOverlay;
