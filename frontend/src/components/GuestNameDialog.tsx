import { useState } from "react";

interface GuestNameDialogProps {
  isOpen: boolean;
  onSubmit: (name: string) => void;
}

export default function GuestNameDialog({ isOpen, onSubmit }: GuestNameDialogProps) {
  const [name, setName] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-96 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Join Session</h2>
        <p className="text-gray-400 mb-4 text-sm">
          You are joining as a guest. Please enter your name to identify yourself to others.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) onSubmit(name.trim());
          }}
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name..."
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white mb-4 focus:outline-none focus:border-purple-500"
            autoFocus
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Join Project
          </button>
        </form>
      </div>
    </div>
  );
}
