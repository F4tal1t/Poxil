import { useState } from "react";
import { Project } from "../types";

interface ExportDialogProps {
  project: Project | null;
  onClose: () => void;
  onExport: (scale: number) => void;
}

export default function ExportDialog({ project, onClose, onExport }: ExportDialogProps) {
  const [scale, setScale] = useState(1);

  if (!project) return null;

  const originalWidth = project.width;
  const originalHeight = project.height;
  const exportWidth = originalWidth * scale;
  const exportHeight = originalHeight * scale;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 text-white rounded-lg p-6 max-w-sm w-full border border-gray-700 shadow-xl">
        <h2 className="text-xl font-bold mb-4">Export Image</h2>
        
        <div className="space-y-6">
          {/* Resolution Info */}
          <div className="bg-gray-900/50 p-4 rounded-lg flex flex-col gap-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Original Size:</span>
              <span>{originalWidth} x {originalHeight} px</span>
            </div>
            <div className="w-full h-px bg-gray-700/50"></div>
            <div className="flex justify-between font-mono text-blue-400">
              <span>Export Size:</span>
              <span>{exportWidth} x {exportHeight} px</span>
            </div>
          </div>

          {/* Scale Slider */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-semibold">Scale Factor</label>
              <span className="text-sm font-bold bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded">
                {scale}x
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="32"
              step="1"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#df4c16]"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1x</span>
              <span>32x</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={() => onExport(scale)}
              className="flex-1 px-4 py-2 bg-[#df4c16] hover:bg-[#E95620] text-white rounded text-sm font-semibold transition shadow-md"
            >
              Export PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
