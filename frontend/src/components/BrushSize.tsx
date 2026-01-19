import { Minus, Plus } from "akar-icons";
import { useEditorStore } from "../lib/store";

interface BrushSizeProps {
  className?: string;
}

export default function BrushSize({ className = "" }: BrushSizeProps) {
  const { selectedTool, setSelectedTool } = useEditorStore();
  const currentSize = selectedTool.size || 1;

  const handleBrushSizeChange = (delta: number) => {
    const newSize = Math.max(1, Math.min(10, currentSize + delta));
    setSelectedTool({ ...selectedTool, size: newSize });
  };

  const handleSizeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = parseInt(e.target.value) || 1;
    setSelectedTool({ ...selectedTool, size });
  };

  return (
    <div className={`bg-[#1f1c21] border border-[#2a2630] rounded-lg p-3 flex items-center gap-3 ${className}`}>
      <span className="text-sm font-medium text-[#8c8796]">Brush Size</span>
      
      <button
        onClick={() => handleBrushSizeChange(-1)}
        className="p-1.5 bg-[#2a2630] hover:bg-[#35303c] rounded transition-colors disabled:opacity-50"
        disabled={currentSize <= 1}
      >
        <Minus size={14} />
      </button>
      
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          max="10"
          value={currentSize}
          onChange={handleSizeInput}
          className="w-12 h-8 text-center bg-[#2a2630] border border-[#4a4552] rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
        />
        <span className="text-xs text-[#ada8b7]">px</span>
      </div>
      
      <button
        onClick={() => handleBrushSizeChange(1)}
        className="p-1.5 bg-[#2a2630] hover:bg-[#35303c] rounded transition-colors disabled:opacity-50"
        disabled={currentSize >= 10}
      >
        <Plus size={14} />
      </button>
      
      <div className="w-px h-6 bg-[#2a2630] mx-1" />
      
      <input
        type="range"
        min="1"
        max="10"
        value={currentSize}
        onChange={handleSizeInput}
        className="w-24 h-2 bg-[#2a2630] rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  );
}