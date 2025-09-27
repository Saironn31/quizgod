import React, { useState } from 'react';

export default function ChangeNameForm({ user, userProfile, refreshUserProfile }: any) {
  const [name, setName] = useState(userProfile?.name ?? '');
  const [username, setUsername] = useState(userProfile?.username ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    setSaving(true);
    setMessage('');
    try {
      const res = await import('@/lib/firestore');
      await res.updateUserProfile(user.uid, { name, username });
      setMessage('Saved!');
      await refreshUserProfile();
    } catch (error) {
      setMessage('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-2 mt-2">
      <label className="text-xs text-white">Name</label>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        className="px-2 py-1 rounded bg-white/20 text-white border border-white/30"
        placeholder="Your name"
      />
      <label className="text-xs text-white">Username</label>
      <input
        type="text"
        value={username}
        onChange={e => setUsername(e.target.value)}
        className="px-2 py-1 rounded bg-white/20 text-white border border-white/30"
        placeholder="Username"
      />
      <button
        type="submit"
        disabled={saving}
        className="px-3 py-1 bg-blue-600 text-white rounded mt-2 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
      {message && <span className="text-xs text-green-300 mt-1">{message}</span>}
    </form>
  );
}
