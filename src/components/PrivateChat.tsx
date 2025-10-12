import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage, getPrivateChatMessages } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';

interface PrivateChatProps {
  friendUid: string;
  friendName: string;
}

const PrivateChat: React.FC<PrivateChatProps> = ({ friendUid, friendName }) => {
  const { user, userProfile } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!user?.uid) return;
      const msgs = await getPrivateChatMessages(user.uid, friendUid);
      setMessages(msgs);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, [user?.uid, friendUid]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user?.uid || !userProfile?.name) return;
    setLoading(true);
    await sendChatMessage({
      senderUid: user.uid,
      senderName: userProfile.name,
      content: input.trim(),
      recipientUid: friendUid
    });
    setInput('');
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 py-8 text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.senderUid === user?.uid ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                msg.senderUid === user?.uid 
                  ? 'bg-purple-600 text-white rounded-br-sm' 
                  : 'bg-slate-700 text-white rounded-bl-sm'
              }`}>
                <div className="text-sm break-words">{msg.content}</div>
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>
      
      {/* Input Area */}
      <form onSubmit={handleSend} className="flex gap-2 p-3 bg-slate-800 rounded-b-2xl border-t border-slate-700">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 px-4 py-2 rounded-xl bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-purple-500 placeholder-slate-400"
          placeholder={`Message ${friendName}...`}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default PrivateChat;
