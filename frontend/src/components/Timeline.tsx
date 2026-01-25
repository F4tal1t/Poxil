import { useState, useRef, useEffect } from "react";
import { Play, Pause, Plus, TrashBin, Copy, EyeOpen, EyeSlashed, ChevronDown, ChevronUp } from "akar-icons";
import { useEditorStore } from "../lib/store";

interface TimelineProps {
  className?: string;
}

export default function Timeline({ className = "" }: TimelineProps) {
  const {
    currentProject,
    currentFrame,
    setCurrentFrame,
    addFrame,
    duplicateFrame,
    deleteFrame,
    isPlaying,
    setIsPlaying,
    showOnionSkin,
    toggleOnionSkin
  } = useEditorStore();

  const [fps, setFps] = useState(12);
  const [collapsed, setCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (containerRef.current) {
       
        const frameEl = containerRef.current.children[currentFrame] as HTMLElement;
        if (frameEl) {
            frameEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
  }, [currentFrame]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentProject) {
      interval = setInterval(() => {
        setCurrentFrame((currentFrame + 1) % currentProject.frames.length);
      }, 1000 / fps);
    }
    return () => clearInterval(interval);
  }, [isPlaying, fps, currentFrame, currentProject, setCurrentFrame]);

  if (!currentProject) return null;

  return (
    <div className={`bg-[#1f1c21] border-t border-[#2a2630] flex flex-col transition-all duration-300 ${collapsed ? "h-10" : "h-36"} ${className}`}>
      {/* Controls Bar */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#2a2630] bg-[#1a181c] h-10 flex-shrink-0">
        
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
            <button
               onClick={() => setCollapsed(!collapsed)}
               className="p-1 hover:bg-[#3d3842] rounded text-gray-400 mr-2"
            >
               {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-1.5 rounded-full transition-colors ${
                  isPlaying ? "bg-[#df4c16] text-white" : "bg-[#2a2630] hover:bg-[#3d3842] text-gray-300"
              }`}
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            >
               {isPlaying ? <Pause size={12} variant="filled" /> : <Play size={12} variant="filled" />}
            </button>

            <div className="flex items-center gap-1 bg-[#2a2630] rounded px-1.5 py-0.5">
                <span className="text-[10px] text-gray-500 font-bold uppercase">FPS</span>
                <input 
                    type="number" 
                    min="1" 
                    max="60" 
                    value={fps} 
                    onChange={(e) => setFps(Number(e.target.value))}
                    className="w-6 bg-transparent text-[10px] text-center text-white outline-none font-mono"
                />
            </div>

            <div className="h-3 w-px bg-[#3d3842] mx-1"></div>

            <button
               onClick={toggleOnionSkin}
               className={`flex items-center gap-2 p-1.5 rounded transition-colors ${
                   showOnionSkin ? "bg-[#3d3842] text-white" : "hover:bg-[#3d3842] text-gray-400"
               }`}
               title="Toggle Onion Skin"
            >
               {showOnionSkin ? <EyeOpen size={14} /> : <EyeSlashed size={14} />}
               <span className="text-[10px] font-bold uppercase hidden sm:inline">Onion Skin</span>
            </button>
        </div>

        {/* Frame Actions */}
        <div className="flex items-center gap-1">
           <button
              onClick={() => duplicateFrame(currentFrame)}
              className="p-1.5 hover:bg-[#3d3842] rounded text-gray-400 hover:text-white transition"
              title="Duplicate Frame"
           >
              <Copy size={14} />
           </button>
           <button
             onClick={() => deleteFrame(currentFrame)}
             className="p-1.5 hover:bg-[#3d3842] rounded text-gray-400 hover:text-red-400 transition disabled:opacity-30 disabled:cursor-not-allowed"
             title="Delete Frame"
             disabled={currentProject.frames.length <= 1}
           >
              <TrashBin size={14} />
           </button>
           <button
             onClick={addFrame}
             className="flex items-center gap-1.5 px-2 py-1 bg-[#df4c16] hover:bg-[#E95620] text-white rounded textxs font-bold transition ml-1"
           >
              <Plus size={12} /> <span className="text-[10px] uppercase">Add</span>
           </button>
        </div>
      </div>

      {/* Frames List */}
      {!collapsed && (
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-2 flex items-center bg-[#151316]">
         <div className="flex gap-1.5" ref={containerRef}>
            {currentProject.frames.map((frame, index) => (
                <div 
                   key={frame.id}
                   onClick={() => setCurrentFrame(index)}
                   className={`relative group flex-shrink-0 w-16 h-16 rounded border cursor-pointer transition-all ${
                       currentFrame === index 
                         ? "border-[#df4c16] bg-[#2a2630]" 
                         : "border-[#2a2630] bg-[#1a181c] hover:border-gray-600"
                   }`}
                >
                                      
                   {/* Mini Preview Placeholder */}
                   <div className="absolute inset-0 m-auto flex items-center justify-center opacity-20 pointer-events-none">
                       <span className="text-xl text-gray-100 font-primary">{index + 1}</span>
                   </div>
                </div>
            ))}
            
            {/* Add Button at end of list */}
            <button
               onClick={addFrame}
               className="flex-shrink-0 w-16 h-16 rounded border border-dashed border-[#2a2630] hover:border-gray-600 text-[#2a2630] hover:text-gray-500 flex items-center justify-center transition"
            >
               <Plus size={18} />
            </button>
         </div>
      </div>
      )}
    </div>
  );
}
