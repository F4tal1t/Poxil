import { useState } from "react";
import { Copy, Check } from "akar-icons";

interface ShareDialogProps {
  isOpen: boolean;
  isPublic: boolean;
  projectId: string;
  onClose: () => void;
  onTogglePublic: (isPublic: boolean) => void;
}

export default function ShareDialog({ isOpen, isPublic, projectId, onClose, onTogglePublic }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/editor/${projectId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-[450px] border border-gray-700" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Share Project</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="space-y-6">
          {/* Public Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700">
            <div>
              <h3 className="font-medium text-white">Public Access</h3>
              <p className="text-sm text-gray-400">Allow anyone with the link to view this project</p>
            </div>
            <button
              onClick={() => onTogglePublic(!isPublic)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isPublic ? 'bg-purple-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isPublic ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Link Copy */}
          {isPublic && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Project Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-300 text-sm focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded border border-gray-600 transition-colors flex items-center gap-2"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}
          
          {!isPublic && (
             <div className="text-sm text-yellow-500 bg-yellow-500/10 p-3 rounded">
                This project is currently private. Enable Public Access to generate a shareable link.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
