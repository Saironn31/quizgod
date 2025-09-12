"use client";
import React, { useState } from "react";

interface AuthModalProps {
  isOpen: boolean;
  mode: "login" | "signup";
  onClose: () => void;
  onAuth: () => void;
}

export default function AuthModal({ isOpen, mode, onClose, onAuth }: AuthModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }
    if (mode === "signup") {
      if (localStorage.getItem(`qg_user_${username}`)) {
        setError("Username already exists.");
        return;
      }
      localStorage.setItem(`qg_user_${username}`, password);
      localStorage.setItem("qg_user", username);
      onAuth();
      onClose();
    } else {
      const stored = localStorage.getItem(`qg_user_${username}`);
      if (stored !== password) {
        setError("Invalid credentials.");
        return;
      }
      localStorage.setItem("qg_user", username);
      onAuth();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-gray-900 relative">
        <button onClick={onClose} className="absolute right-4 top-3 text-2xl">×</button>
        <h2 className="text-2xl font-bold mb-4 text-center">{mode === "signup" ? "Sign Up Free" : "Login"}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="px-4 py-2 rounded border border-gray-300 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="px-4 py-2 rounded border border-gray-300 focus:outline-none"
          />
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <button type="submit" className="bg-purple-600 text-white py-2 rounded font-semibold hover:bg-purple-700">
            {mode === "signup" ? "Sign Up" : "Login"}
          </button>
          <button type="button" onClick={onClose} className="mt-2 text-gray-500 hover:underline">Cancel</button>
        </form>
      </div>
    </div>
  );
}
