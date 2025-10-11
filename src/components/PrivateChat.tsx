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
    <div className="flex flex-col h-full bg-white/10 rounded-lg border border-white/20 p-4">
      <div className="flex-1 overflow-y-auto mb-2">
        {messages.map(msg => (
          <div key={msg.id} className={`mb-2 ${msg.senderUid === user?.uid ? 'text-right' : 'text-left'}`}>
            <span className="text-xs text-green-300">{msg.senderName}:</span>
            <div className="inline-block px-3 py-1 rounded bg-white/20 text-white ml-2">{msg.content}</div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 px-2 py-1 rounded bg-white/20 text-white border border-white/30"
          placeholder={`Message ${friendName}...`}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50"
        >Send</button>
      </form>
    </div>
  );
};

export default PrivateChat;
