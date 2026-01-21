import { useEffect, useRef } from "react";
import { Plus, TrashBin, EyeOpen, EyeSlashed, LockOn, LockOff } from "akar-icons";
import { useEditorStore } from "../lib/store";
import ColorPalette from "./ColorPalette";

interface RightSidebarProps {
  className?: string;
}

export default function RightSidebar({ className = "" }: RightSidebarProps) {
  const { 
    currentProject, 
    currentFrame, 
    activeLayerId,
    setActiveLayer,
    addLayer,
    deleteLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    updateLayerOpacity
  } = useEditorStore();
  
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Preview rendering logic
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !currentProject) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = currentProject.width;
    const height = currentProject.height;
    
    // Auto-scale to fit container
    const size = 180; 
    const scale = Math.min(size / width, size / height);
    
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Checkered background
    const checkerSize = 10;
    ctx.fillStyle = "#33333350";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#4444444e";
    for (let y = 0; y < canvas.height; y += checkerSize) {
      for (let x = 0; x < canvas.width; x += checkerSize) {
         if ((x/checkerSize + y/checkerSize) % 2 === 0) {
            ctx.fillRect(x, y, checkerSize, checkerSize);
         }
      }
    }

    // Draw layers from bottom to top
    const frame = currentProject.frames[currentFrame];
    if (!frame || !frame.layers) return;

    // Layers are stored Top->Bottom in array (index 0 is top)
    // So we render reverse: length-1 -> 0 to composite correctly
    const layers = currentProject.layers || [];
    [...layers].reverse().forEach(layer => {
        if (!layer.visible) return;
        
        const grid = frame.layers[layer.id];
        if (!grid) return;

        ctx.globalAlpha = layer.opacity / 100;
        ctx.imageSmoothingEnabled = false; 
        
        // Center the preview
        const offsetX = (canvas.width - width * scale) / 2;
        const offsetY = (canvas.height - height * scale) / 2;

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const color = grid[y]?.[x] || "transparent";
            if (color !== "transparent") {
              ctx.fillStyle = color;
              ctx.fillRect(
                 Math.floor(offsetX + x * scale), 
                 Math.floor(offsetY + y * scale), 
                 Math.ceil(scale), 
                 Math.ceil(scale)
              );
            }
          }
        }
        ctx.globalAlpha = 1.0;
    });

  }, [currentProject, currentFrame, currentProject?.layers, currentProject?.frames]);

  const activeLayer = currentProject?.layers.find(l => l.id === activeLayerId);

  return (
    <div className={`bg-[#1f1c21] border-l border-[#2a2630] flex flex-col h-full overflow-y-auto ${className}`}>
      {/* 1. Preview Module */}
      <div className="p-4 border-b border-[#2a2630]">
        <h3 className="text-xs font-bold text-[#8c8796] mb-2 uppercase tracking-wider">Preview</h3>
        <div className="bg-[#151316] rounded-lg p-2 flex items-center justify-center border border-[#2a2630] shadow-inner">
           <canvas 
              ref={previewCanvasRef} 
              width={200} 
              height={200}
              className="max-w-full max-h-[200px]"
           />
        </div>
      </div>

      {/* 2. Layers Module (Above Colors) */}
      <div className="flex-1 border-b border-[#2a2630] p-4 flex flex-col min-h-[200px]">
         <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-[#8c8796] uppercase tracking-wider">Layers</h3>
            <button 
              onClick={addLayer}
              className="p-1 hover:bg-[#3d3842] rounded text-gray-400 hover:text-white transition"
              title="Add Layer"
            >
               <Plus size={14} />
            </button>
         </div>

         <div className="flex-1 overflow-y-auto space-y-1 bg-[#151316] border border-[#2a2630] p-1 mb-3">
             {currentProject?.layers.map((layer) => (
               <div 
                 key={layer.id}
                 onClick={() => setActiveLayer(layer.id)}
                 className={`group flex items-center gap-2 px-2 py-2 border cursor-pointer transition ${
                   activeLayerId === layer.id 
                     ? 'bg-[#df4c16]/20 border-[#df4c16]/50' 
                     : 'hover:bg-[#2a2630] border-transparent'
                 }`}
               >
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}
                    className={`hover:text-white ${layer.visible ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    {layer.visible ? <EyeOpen size={14} /> : <EyeSlashed size={14} />}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleLayerLock(layer.id); }}
                    className={`hover:text-white ${layer.locked ? 'text-red-400' : 'text-gray-600'}`}
                  >
                    {layer.locked ? <LockOn size={14} /> : <LockOff size={14} />}
                  </button>
                  
                  <span className={`flex-1 text-xs font-medium truncate ${
                    activeLayerId === layer.id ? 'text-white' : 'text-gray-400'
                  }`}>
                    {layer.name}
                  </span>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition"
                  >
                    <TrashBin size={14} />
                  </button>
               </div>
             ))}
         </div>
         
         <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
               <span>Opacity</span>
               <span>{activeLayer ? activeLayer.opacity : 100}%</span>
            </div>
            <input 
              type="range" 
              className="w-full h-1 bg-gray-700 appearance-none cursor-pointer accent-[#df4c16]" 
              min={0}
              max={100}
              value={activeLayer ? activeLayer.opacity : 100}
              disabled={!activeLayer}
              onChange={(e) => activeLayer && updateLayerOpacity(activeLayer.id, parseInt(e.target.value))}
            />
            <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
               <span>Blend Mode</span>
               <select className="bg-[#2a2630] border border-gray-700 px-1 py-0.5 text-xs text-gray-300 outline-none">
                  <option>Normal</option>
                  <option>Multiply</option>
                  <option>Overlay</option>
               </select>
            </div>
         </div>
      </div>

      {/* 3. Color Palette (Zero padding, No rounded corners) */}
      <div className="">
        <ColorPalette className="!border-l-0 !p-0 !h-auto" />
      </div>
    </div>
  );
}
