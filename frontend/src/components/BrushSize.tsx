import { Minus, Plus } from "akar-icons";
import { useEditorStore } from "../lib/store";

interface BrushSizeProps {
  className?: string;
}

export default function BrushSize({ className = "" }: BrushSizeProps) {
  const { selectedTool, setSelectedTool } = useEditorStore();
  const currentSize = selectedTool.size || 1;

  const handleBrushSizeChange = (delta: number) => {
    const newSize = Math.max(1, Math.min(32, currentSize + delta));
    setSelectedTool({ ...selectedTool, size: newSize });
  };

  const handleSizeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = parseInt(e.target.value) || 1;
    setSelectedTool({ ...selectedTool, size });
  };

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-3 flex items-center gap-3 ${className}`}>
      <span className="text-sm font-medium text-gray-300">Brush Size</span>
      
      <button
        onClick={() => handleBrushSizeChange(-1)}
        className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded transition-colors disabled:opacity-50"
        disabled={currentSize <= 1}
      >
        <Minus size={14} />
      </button>
      
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          max="32"
          value={currentSize}
          onChange={handleSizeInput}
          className="w-12 h-8 text-center bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-xs text-gray-400">px</span>
      </div>
      
      <button
        onClick={() => handleBrushSizeChange(1)}
        className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded transition-colors disabled:opacity-50"
        disabled={currentSize >= 32}
      >
        <Plus size={14} />
      </button>
      
      <div className="w-px h-6 bg-gray-700 mx-1" />
      
      <input
        type="range"
        min="1"
        max="32"
        value={currentSize}
        onChange={handleSizeInput}
        className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
      />
      
      {/* Visual preview of brush size */}
      <div className="flex items-center justify-center w-12 h-8 bg-gray-700 rounded border border-gray-600">
        <div 
          className="bg-white rounded-full"
          style={{ 
            width: `${Math.min(currentSize * 2, 16)}px`, 
            height: `${Math.min(currentSize * 2, 16)}px` 
          }}
        />
      </div>
    </div>
  );
}