import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage, getClassChatMessages } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';

interface ClassChatProps {
  classId: string;
}

const ClassChat: React.FC<ClassChatProps> = ({ classId }) => {
  const { user, userProfile } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const msgs = await getClassChatMessages(classId);
      setMessages(msgs);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, [classId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user?.uid || !userProfile?.name) return;
    setLoading(true);
    await sendChatMessage({
      senderUid: user.uid,
      senderName: userProfile.name,
      content: input.trim(),
      classId
    });
    setInput('');
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-96 bg-white/10 rounded-xl border border-white/20 p-4">
      <div className="flex-1 overflow-y-auto mb-2">
        {messages.map(msg => (
          <div key={msg.id} className={`mb-2 ${msg.senderUid === user?.uid ? 'text-right' : 'text-left'}`}>
            <span className="text-xs text-purple-300">{msg.senderName}:</span>
            <div className="inline-block px-3 py-1 rounded bg-white/20 text-white ml-2">{msg.content}</div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 px-2 py-1 rounded bg-white/20 text-white border border-white/30"
          placeholder="Type a message..."
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
        >Send</button>
      </form>
    </div>
  );
};

export default ClassChat;
