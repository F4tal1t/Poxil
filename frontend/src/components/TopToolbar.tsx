import { useState } from "react";
import { Download, Save, SettingsHorizontal, ArrowBack, ArrowForward, Cloud, ZoomIn, ZoomOut } from "akar-icons";
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
    pixelPerfect, togglePixelPerfect,
    mirrorX, toggleMirrorX,
    mirrorY, toggleMirrorY
  } = useEditorStore();
  
  return (
    <div className="bg-[#1f1c21] border-b border-[#2a2630] px-4 py-2 flex items-center justify-between text-[#cecece]">
      {/* Left Section: Tool Options */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <span className="font-bold text-sm tracking-wide uppercase text-[#8c8796]">
            {selectedTool.type}
          </span>
          
          {selectedTool.type === 'pencil' && (
             <div className="flex items-center gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                  <input 
                    type="checkbox" 
                    checked={pixelPerfect}
                    onChange={togglePixelPerfect}
                    className="rounded bg-[#2a2630] border-gray-600 focus:ring-blue-500 text-blue-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  Pixel Perfect
                </label>
             </div>
          )}
        </div>

        {/* Brush Size Component - Integrated here */}
        <div className="h-8 w-px bg-[#2a2630]"></div>
        <BrushSize className="!bg-transparent !border-none !p-0" />
        
        <div className="h-8 w-px bg-[#2a2630]"></div>
        
        {/* Mirror Controls */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
            <input 
              type="checkbox" 
              checked={mirrorX}
              onChange={toggleMirrorX}
              className="rounded bg-[#2a2630] border-gray-600 focus:ring-blue-500 text-blue-500 w-3.5 h-3.5 cursor-pointer"
            />
            Mirror X
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
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

      {/* Center Section: Space filler */}
      <div className="hidden md:flex flex-1"></div>

      {/* Right Section: Global Actions */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-[#2a2630] rounded-md overflow-hidden mr-2">
           <button 
             onClick={onZoomOut}
             className="px-2 py-1.5 hover:bg-[#35303c] transition-colors border-r border-[#1f1c21]"
             title="Zoom Out"
           >
             <ZoomOut size={16} />
           </button>
           <button 
             onClick={onZoomReset}
             className="px-2 py-1.5 hover:bg-[#35303c] transition-colors border-r border-[#1f1c21] text-xs font-mono min-w-[3rem]"
             title="Reset Zoom"
           >
             {Math.round(zoom * 100)}%
           </button>
           <button 
             onClick={onZoomIn}
             className="px-2 py-1.5 hover:bg-[#35303c] transition-colors"
             title="Zoom In"
           >
             <ZoomIn size={16} />
           </button>
        </div>

        <div className="flex items-center bg-[#2a2630] rounded-md overflow-hidden mr-2">
           <button 
             className="px-3 py-1.5 hover:bg-[#35303c] transition-colors border-r border-[#1f1c21]"
             title="Undo (Ctrl+Z)"
           >
             <ArrowBack size={16} />
           </button>
           <button 
             className="px-3 py-1.5 hover:bg-[#35303c] transition-colors"
             title="Redo (Ctrl+Y)"
           >
             <ArrowForward size={16} />
           </button>
        </div>

        <button className="flex items-center gap-2 px-3 py-1.5 bg-[#2a2630] hover:bg-[#35303c] rounded text-xs font-medium transition-colors">
          <Download size={14} />
          <span>Download</span>
        </button>
        
        <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors text-white">
          <Save size={14} />
          <span>Save Drawing</span>
        </button>
      </div>
    </div>
  );
}
