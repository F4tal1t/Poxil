import { useState } from "react";
import { ZoomIn, ZoomOut } from "akar-icons";
import { useEditorStore } from "../lib/store";
import BrushSize from "./BrushSize";

interface TopToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  mousePos: { x: number; y: number } | null;
  canvasSize: { width: number; height: number };
}

export default function TopToolbar({ zoom, onZoomIn, onZoomOut, onZoomReset, mousePos, canvasSize }: TopToolbarProps) {
  const { 
    selectedTool, 
    mirrorX, toggleMirrorX,
    mirrorY, toggleMirrorY
  } = useEditorStore();
  
  return (
    <div className="bg-[#1f1c21] border-b border-[#2a2630] px-4 py-1.5 flex items-center justify-between text-[#cecece] shadow-md z-10 relative text-xs">
      {/* Left Section: Tool Options */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <span className="font-bold tracking-wide uppercase text-[#8c8796]">
            {selectedTool.type}:
          </span>
          
          
        </div>

        {/* Brush Size Component - Integrated here */}
        <div className="h-4 w-px bg-[#2a2630]"></div>
        <BrushSize className="!bg-transparent !border-none !p-0 scale-90 origin-left" />
        
        <div className="h-4 w-px bg-[#2a2630]"></div>
        
        {/* Mirror Controls */}
        <div className="flex items-center gap-4 font-medium">
          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors select-none">
            <input 
              type="checkbox" 
              checked={mirrorX}
              onChange={toggleMirrorX}
              className="rounded bg-[#2a2630] border-gray-600 focus:ring-blue-500 text-blue-500 w-3.5 h-3.5 cursor-pointer"
            />
            Mirror X
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors select-none">
            <input 
              type="checkbox" 
              checked={mirrorY}
              onChange={toggleMirrorY}
              className="rounded bg-[#2a2630] border-gray-600 focus:ring-blue-500 text-blue-500 w-3.5 h-3.5 cursor-pointer"
            />
            Mirror Y
          </label>
        </div>
      </div>

      {/* Right Section: View Controls (moved here temporarily until Nav pane exists) */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-[#2a2630] rounded-md overflow-hidden">
           <button 
             onClick={onZoomOut}
             className="px-2 py-1 hover:bg-[#35303c] transition-colors border-r border-[#1f1c21]"
             title="Zoom Out"
           >
             <ZoomOut size={14} />
           </button>
           <button 
             onClick={onZoomReset}
             className="px-2 py-1 hover:bg-[#35303c] transition-colors border-r border-[#1f1c21] font-mono min-w-[3rem] text-center"
             title="Reset Zoom"
           >
             {Math.round(zoom * 100)}%
           </button>
           <button 
             onClick={onZoomIn}
             className="px-2 py-1 hover:bg-[#35303c] transition-colors"
             title="Zoom In"
           >
             <ZoomIn size={14} />
           </button>
        </div>
      </div>
    </div>
  );
}
