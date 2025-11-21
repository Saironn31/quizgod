import React, { useState } from 'react';
import { sendFriendRequest } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';

const FriendRequestForm: React.FC = () => {
  const { user } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate identifier format
    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier) {
      setMessage('Please enter a username or email');
      return;
    }
    
    if (trimmedIdentifier.length < 3) {
      setMessage('Username must be at least 3 characters');
      return;
    }
    
    setLoading(true);
    setMessage('');
    try {
      if (!user?.uid) throw new Error('Not logged in');
      await sendFriendRequest(user.uid, trimmedIdentifier);
      setMessage('Friend request sent!');
      setIdentifier('');
    } catch (error: any) {
      setMessage(error.message || 'Failed to add friend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleAddFriend} className="flex flex-col gap-2 p-4 bg-white/10 rounded-xl border border-white/20">
      <label className="text-xs text-white">Add Friend by Username or Email</label>
      <input
        type="text"
        value={identifier}
        onChange={e => setIdentifier(e.target.value)}
        className="px-2 py-1 rounded bg-white/20 text-white border border-white/30"
        placeholder="Username or Email"
        required
      />
      <button
        type="submit"
        disabled={loading || !identifier.trim()}
        className="px-3 py-1 bg-green-600 text-white rounded mt-2 disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Friend'}
      </button>
      {message && <span className="text-xs text-green-300 mt-1">{message}</span>}
    </form>
  );
};

export default FriendRequestForm;
