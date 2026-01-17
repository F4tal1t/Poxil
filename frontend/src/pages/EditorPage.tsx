import { useState } from "react";
import { useParams } from "react-router-dom";
import { ZoomIn, ZoomOut, Save, Download, Plus } from "akar-icons";
import CanvasSizeDialog from "../components/CanvasSizeDialog";
import PixelCanvas from "../components/PixelCanvas";

const COLOR_PRESETS = [
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF",
  "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080",
  "#FFC0CB", "#A52A2A", "#808080", "#C0C0C0", "#FFD700",
  "#4B0082", "#FF6347", "#40E0D0", "#EE82EE", "#F5DEB3",
];

export default function EditorPage() {
  const { projectId } = useParams();
  const [showDialog, setShowDialog] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 32, height: 32 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedColor, setSelectedColor] = useState("#000000");
  const pixelSize = 16;

  const handleCanvasCreate = (width: number, height: number) => {
    setCanvasSize({ width, height });
    setShowDialog(false);
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

  return (
    <>
      {showDialog && <CanvasSizeDialog onConfirm={handleCanvasCreate} />}

      <div className="h-screen flex flex-col bg-gray-900 text-white">
        <header className="bg-gray-800 px-4 py-3 flex justify-between items-center border-b border-gray-700">
          <h1 className="text-xl font-bold font-emphasis">Poxil</h1>
          <div className="flex gap-2 items-center">
            <div className="flex gap-1 items-center bg-gray-700 rounded px-2">
              <button 
                onClick={handleZoomOut}
                className="px-3 py-2 hover:bg-gray-600 rounded transition"
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>
              <button 
                onClick={handleZoomReset}
                className="px-3 py-2 hover:bg-gray-600 rounded transition text-sm"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button 
                onClick={handleZoomIn}
                className="px-3 py-2 hover:bg-gray-600 rounded transition"
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
          <div 
            className="flex-1 flex items-center justify-center p-4 overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
            style={{ cursor: isPanning ? 'grabbing' : 'default' }}
          >
            <PixelCanvas 
              width={canvasSize.width} 
              height={canvasSize.height}
              pixelSize={pixelSize}
              zoom={zoom}
              pan={pan}
            />
          </div>

          <aside className="w-64 bg-gray-800 p-4 border-l border-gray-700 overflow-y-auto">
            <h3 className="font-semibold mb-4 text-lg">Colors</h3>
            
            <div className="mb-4">
              <label className="block text-sm mb-2">Selected Color</label>
              <div className="flex gap-2 items-center">
                <div 
                  className="w-12 h-12 rounded border-2 border-gray-600"
                  style={{ backgroundColor: selectedColor }}
                />
                <input 
                  type="color" 
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="flex-1 h-12 rounded cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2">Color Palette</label>
              <div className="grid grid-cols-5 gap-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded border-2 transition ${
                      selectedColor === color ? 'border-white scale-110' : 'border-gray-600'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-700">
              <p className="text-sm text-gray-400">Canvas: {canvasSize.width}x{canvasSize.height}</p>
              <p className="text-sm text-gray-400">Zoom: {Math.round(zoom * 100)}%</p>
              <p className="text-sm text-gray-500 mt-2">Hold Shift or Middle Click to pan</p>
            </div>
          </aside>
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
