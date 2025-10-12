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
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);

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
    // Fetch classes
    const fetchClasses = async () => {
      const res = await import('@/lib/firestore');
      const userClasses = await res.getUserClasses(user.email || user.uid);
      setClasses(userClasses.map(c => ({ id: c.id, name: c.name })));
    };
    fetchClasses();
  }, [open, user?.uid, userProfile?.friends, user?.email]);

  // Overlay UI: show chat mode selector, friends list, or class chat
  return (
    <>
      {open && (
        <div className="fixed bottom-4 right-4 md:right-4 md:bottom-4 bottom-28 left-4 md:left-auto z-50 md:w-96 w-auto bg-slate-900 rounded-2xl shadow-2xl border border-purple-500/30 flex flex-col overflow-hidden max-h-[80vh] md:max-h-[600px]">
          {/* Unified Header */}
          <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white shrink-0">
            {/* Back button - only show when viewing specific friend or class */}
            {(friend || classId) && (
              <button 
                className="text-xl hover:scale-110 transition-transform shrink-0" 
                onClick={() => {
                  if (friend) setFriend(null);
                  if (classId) setClassId(null);
                }} 
                aria-label="Back"
              >
                ←
              </button>
            )}
            
            {/* Title */}
            <span className="font-bold text-base md:text-lg flex-1 text-center truncate px-2">
              {friend 
                ? (friend.name || friend.username || friend.email).substring(0, 15) + ((friend.name || friend.username || friend.email).length > 15 ? '...' : '')
                : classId 
                ? className 
                : 'Messages'}
            </span>
            
            {/* Close button */}
            <button 
              className="text-xl hover:scale-110 transition-transform shrink-0" 
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ✖
            </button>
          </div>

          {/* Tab Selector - Only show when not in a specific chat */}
          {!friend && !classId && (
            <div className="flex gap-1 p-2 bg-slate-800 border-b border-purple-500/20">
              <button
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  chatMode === 'private' 
                    ? 'bg-purple-600 text-white shadow-lg' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
                onClick={() => setChatMode('private')}
              >
                Private
              </button>
              <button
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  chatMode === 'class' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
                onClick={() => {
                  setChatMode('class');
                  setClassId(null);
                  setClassName('Class');
                }}
              >
                Class
              </button>
            </div>
          )}

          {/* Content Area */}
          {chatMode === 'private' && !friend && (
            <div className="p-3 max-h-96 overflow-y-auto bg-slate-900">
              {friends.length === 0 ? (
                <div className="text-center text-slate-400 py-12">
                  <div className="text-4xl mb-3">💬</div>
                  <p>No friends to chat with</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {friends.map(f => (
                    <li 
                      key={f.uid} 
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-purple-600/20 cursor-pointer transition-all border border-transparent hover:border-purple-500/30" 
                      onClick={() => setFriend(f)}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg">
                        {f.name?.charAt(0).toUpperCase() || f.username?.charAt(0).toUpperCase() || f.email?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white truncate">{f.username || f.name || f.email}</div>
                        <div className="text-xs text-slate-400 truncate">
                          {lastMessages[f.uid] || 'Start a conversation'}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {chatMode === 'private' && friend && (
            <div className="flex flex-col h-[450px] bg-slate-900">
              <div className="p-3 flex-1 overflow-hidden">
                <PrivateChat friendUid={friend.uid} friendName={friend.name || friend.username || friend.email} />
              </div>
            </div>
          )}
          
          {chatMode === 'class' && (
            <div className="flex flex-col h-[450px] bg-slate-900">
              {!classId ? (
                <div className="p-4">
                  <h4 className="font-semibold text-slate-300 mb-3 text-sm">Select a Class</h4>
                  {classes.length === 0 ? (
                    <div className="text-center text-slate-400 py-12">
                      <div className="text-4xl mb-3">🏫</div>
                      <p>No classes found</p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {classes.map(c => (
                        <li 
                          key={c.id} 
                          className="bg-slate-800 rounded-xl px-4 py-3 cursor-pointer hover:bg-blue-600/20 transition-all border border-transparent hover:border-blue-500/30" 
                          onClick={() => { setClassId(c.id); setClassName(c.name); }}
                        >
                          <span className="font-semibold text-white">{c.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="p-3 flex-1 overflow-hidden">
                  <ClassChat classId={classId} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {!open && (
        <button 
          className="fixed bottom-24 right-4 md:bottom-4 md:right-4 z-50 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 md:px-6 py-3 rounded-full shadow-2xl hover:scale-105 transition-transform font-semibold flex items-center gap-2" 
          onClick={() => setOpen(true)}
        >
          <span className="text-xl">💬</span>
          <span className="hidden md:inline">Chat</span>
        </button>
      )}
    </>
  );
};

export default ChatOverlay;
