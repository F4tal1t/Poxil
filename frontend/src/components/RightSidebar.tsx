import { useEffect, useRef, useState } from "react";
import { Plus, TrashBin, EyeOpen, EyeSlashed, LockOn, LockOff } from "akar-icons";
import { useEditorStore } from "../lib/store";
import ColorPalette from "./ColorPalette";

interface RightSidebarProps {
  className?: string;
}

const LayerPreview = ({ grid, width, height }: { grid: string[][] | undefined, width: number, height: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw checkerboard background for transparency
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#333';
    const checkSize = 4;
    for(let y=0; y<canvas.height; y+=checkSize) {
        for(let x=0; x<canvas.width; x+=checkSize) {
            if(((x/checkSize) + (y/checkSize)) % 2 === 0) ctx.fillRect(x,y,checkSize,checkSize);
        }
    }

    if (!grid) return;
    
    const scaleX = canvas.width / width;
    const scaleY = canvas.height / height;
    const scale = Math.min(scaleX, scaleY);
    
    // Center it
    const offsetX = (canvas.width - width * scale) / 2;
    const offsetY = (canvas.height - height * scale) / 2;

    for (let y = 0; y < height; y++) {
      if (!grid[y]) continue;
      for (let x = 0; x < width; x++) {
        const color = grid[y][x];
        if (color && color !== 'transparent') {
          ctx.fillStyle = color;
          ctx.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale);
        }
      }
    }
  }, [grid, width, height]);

  return <canvas ref={canvasRef} width={32} height={32} className="w-8 h-8 flex-shrink-0 border border-gray-600 rounded bg-[#1a1a1a]" />;
};

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
    updateLayerOpacity,
    renameLayer
  } = useEditorStore();
  
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const startEditing = (id: string, currentName: string) => {
    setEditingLayerId(id);
    setEditName(currentName);
  };

  const saveLayerName = () => {
    if (editingLayerId && editName.trim()) {
      renameLayer(editingLayerId, editName.trim());
    }
    setEditingLayerId(null);
  };


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setReferenceImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Preview rendering logic (Main Preview)
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

  const activeLayer = currentProject?.layers?.find(l => l.id === activeLayerId);
  const [activeTab, setActiveTab] = useState("all"); 

  const scrollToSection = (id: string) => {
      const element = document.getElementById(id);
      if(element) element.scrollIntoView({ behavior: 'smooth' });
      setActiveTab(id);
  };

  return (
    <div className={`flex h-full ${className}`}>
      
      {/* VERTICAL SIDE MENU */}
      <div className="w-8 flex flex-col items-center bg-[#151316] border-b border-[#2a2630] h-fit text-[10px] font-bold text-gray-400 py-2 gap-4 select-none">
          <div 
             className="vertical-text cursor-pointer hover:text-white transition uppercase tracking-widest text-[#8c8796]"
             style={{ writingMode: 'vertical-lr', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
             onClick={() => scrollToSection('section-preview')}
          >
             Preview
          </div>
          <div 
             className="vertical-text cursor-pointer hover:text-white transition uppercase tracking-widest text-[#8c8796]"
             style={{ writingMode: 'vertical-lr', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
             onClick={() => scrollToSection('section-layers')}
          >
             Layer
          </div>
           <div 
             className="vertical-text cursor-pointer hover:text-white transition uppercase tracking-widest text-[#8c8796]"
             style={{ writingMode: 'vertical-lr', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
             onClick={() => scrollToSection('section-colors')}
          >
             Colors
          </div>
           <div 
             className="vertical-text cursor-pointer hover:text-white transition uppercase tracking-widest text-[#8c8796]"
             style={{ writingMode: 'vertical-lr', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
             onClick={() => scrollToSection('section-reference')}
          >
             Reference
          </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#1f1c21] border-l border-[#2a2630]">
        {/* 1. Preview Module */}
        <div id="section-preview" className="p-4 border-b border-[#2a2630]">
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

      {/* Reference Module */}
      <div id="section-reference" className="p-4 border-b border-[#2a2630]">
        <h3 className="text-xs font-bold text-[#8c8796] mb-2 uppercase tracking-wider">Reference</h3>
        <div className="bg-[#151316] rounded-lg p-2 min-h-[100px] border border-[#2a2630] flex flex-col items-center justify-center relative overflow-hidden group">
            {referenceImage ? (
                <>
                  <img src={referenceImage} className="max-w-full max-h-[150px] object-contain" />
                  <button onClick={() => setReferenceImage(null)} className="absolute top-1 right-1 bg-black/50 p-1 rounded hover:bg-red-500/50 text-white opacity-0 group-hover:opacity-100 transition">
                    <TrashBin size={12} />
                  </button>
                </>
            ) : (
                <label className="cursor-pointer text-gray-500 hover:text-white flex flex-col items-center gap-1 w-full h-full justify-center min-h-[100px]">
                    <Plus size={20} />
                    <span className="text-xs">Add Image</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
            )}
        </div>
      </div>

      {/* 2. Layers Module (Above Colors) */}
      <div id="section-layers" className="flex-1 border-b border-[#2a2630] p-4 flex flex-col min-h-[280px]">
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
                  <LayerPreview 
                      grid={currentProject.frames[currentFrame]?.layers[layer.id]} 
                      width={currentProject.width} 
                      height={currentProject.height} 
                  />

                  <div className="flex flex-col flex-1 min-w-0">
                      {editingLayerId === layer.id ? (
                        <input
                          type="text"
                          value={editName}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={saveLayerName}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveLayerName();
                            if (e.key === 'Escape') setEditingLayerId(null);
                          }}
                          className="text-xs bg-[#0f0e10] text-white border border-blue-500 rounded px-1 py-0.5 w-full outline-none"
                        />
                      ) : (
                        <span 
                          className={`text-xs font-medium truncate ${
                            activeLayerId === layer.id ? 'text-white' : 'text-gray-400'
                          }`}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            startEditing(layer.id, layer.name);
                          }}
                        >
                          {layer.name}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">
                        {layer.opacity}% • {layer.visible ? 'Vis' : 'Hid'}
                      </span>
                  </div>
                  
                  <div className="flex flex-col gap-1 items-end">
                    <button 
                        onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}
                        className={`hover:text-white ${layer.visible ? 'text-gray-400' : 'text-gray-200'}`}
                    >
                        {layer.visible ? <EyeOpen size={12} /> : <EyeSlashed size={12} />}
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); toggleLayerLock(layer.id); }}
                        className={`hover:text-white ${layer.locked ? 'text-red-400' : 'text-gray-200'}`}
                    >
                        {layer.locked ? <LockOn size={12} /> : <LockOff size={12} />}
                    </button>
                  </div>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
                    className="text-gray-200 hover:text-red-500 transition ml-1"
                  >
                    <TrashBin size={12} />
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
      <div id="section-colors" className="">
        <ColorPalette className="!border-l-0 !p-0 !h-auto" />
      </div>
    </div>
  </div>
  );
}
