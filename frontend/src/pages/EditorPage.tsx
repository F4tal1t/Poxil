import { useState } from "react";
import { useParams } from "react-router-dom";
import { ZoomIn, ZoomOut, Save, Download, Plus } from "akar-icons";
import CanvasSizeDialog from "../components/CanvasSizeDialog";
import InteractiveCanvas from "../components/InteractiveCanvas";
import ToolPalette from "../components/ToolPalette";
import BrushSize from "../components/BrushSize";
import ColorPalette from "../components/ColorPalette";
import { useEditorStore } from "../lib/store";



export default function EditorPage() {
  const { projectId } = useParams();
  const [showDialog, setShowDialog] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 32, height: 32 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  const { setCurrentProject } = useEditorStore();
  const pixelSize = 16;

  const handleCanvasCreate = (width: number, height: number) => {
    setCanvasSize({ width, height });
    setShowDialog(false);
    
    // Initialize project in store
    const newProject = {
      id: projectId || "temp-project",
      name: "New Project",
      width,
      height,
      frames: [{
        id: "frame-1",
        pixels: Array(height).fill(null).map(() => Array(width).fill("transparent")),
        duration: 100
      }],
      isPublic: false,
      userId: "temp-user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setCurrentProject(newProject);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.25));
  const handleZoomReset = () => setZoom(1);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2 || e.shiftKey) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.25 : 0.25;
    setZoom((prev) => Math.max(0.25, Math.min(4, prev + delta)));
  };

  return (
    <>
      {showDialog && <CanvasSizeDialog onConfirm={handleCanvasCreate} />}

      <div className="h-screen flex flex-col bg-[#151316] text-white">
        <header className="bg-[#1f1c21] px-4 py-3 flex justify-between items-center border-b border-[#2a2630]">
          <h1 className="text-xl font-bold font-emphasis">Poxil</h1>
          <div className="flex gap-3 items-center">
            {/* Brush Size - Now at top */}
            <BrushSize />
            
            <div className="flex gap-1 items-center bg-[#2a2630] rounded px-2">
              <button 
                onClick={handleZoomOut}
                className="px-3 py-2 hover:bg-[#35303c] rounded transition"
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>
              <button 
                onClick={handleZoomReset}
                className="px-3 py-2 hover:bg-[#35303c] rounded transition text-sm"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button 
                onClick={handleZoomIn}
                className="px-3 py-2 hover:bg-[#35303c] rounded transition"
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </button>
            </div>
            <button className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition flex items-center gap-2">
              <Save size={18} />
              Save
            </button>
            <button className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 transition flex items-center gap-2">
              <Download size={18} />
              Export
            </button>
          </div>
        </header>

        <main className="flex-1 flex overflow-hidden">
          {/* Tool Palette - Left Side (Compact) */}
          <ToolPalette compact className="w-14" />
          
          {/* Canvas Area */}
          <div 
            className="flex-1 flex items-center justify-center p-4 overflow-hidden bg-[#151316]"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onContextMenu={(e) => e.preventDefault()}
            style={{ cursor: isPanning ? 'grabbing' : 'default' }}
          >
            <InteractiveCanvas 
              width={canvasSize.width} 
              height={canvasSize.height}
              pixelSize={pixelSize}
              zoom={zoom}
              pan={pan}
            />
          </div>

          {/* Color Palette - Right Side (Optimized) */}
          <ColorPalette className="w-64" />
        </main>

        <footer className="bg-gray-800 px-4 py-3 border-t border-gray-700">
          <div className="flex gap-2 items-center">
            <button className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition">
              Frame 1
            </button>
            <button className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition flex items-center gap-2">
              <Plus size={18} />
              Add Frame
            </button>
          </div>
        </footer>
      </div>
    </>
  );
}