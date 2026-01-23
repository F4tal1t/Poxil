import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Timeline from "../components/Timeline";
import { useEditorStore } from "../lib/store";
import Header from "../components/Header";
import TopToolbar from "../components/TopToolbar";
import ToolPalette from "../components/ToolPalette";
import CanvasSizeDialog from "../components/CanvasSizeDialog";
import InteractiveCanvas from "../components/InteractiveCanvas";
import RightSidebar from "../components/RightSidebar";
import axios from "axios";

export default function EditorPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 32, height: 32 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState<{ x: number, y: number } | null>(null);
  const [isLoading, setIsLoading] = useState(!!projectId);
  
  const { setCurrentProject, currentProject } = useEditorStore();
  const pixelSize = 16;

  useEffect(() => {
    if (projectId) {
      setShowDialog(false); // Don't show new canvas dialog if loading existing project
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`/api/projects/${projectId}`);
      const projectData = res.data;
      
      // Ensure frames are properly parsed if they come as string
      if (typeof projectData.frames === 'string') {
        try {
          projectData.frames = JSON.parse(projectData.frames);
        } catch (e) {
          console.error("Failed to parse frames", e);
          projectData.frames = [];
        }
      }

      // Polyfill layers if missing (legacy projects) or empty
      if ((!projectData.layers || projectData.layers.length === 0) && projectData.frames && projectData.frames.length > 0) {
           const firstFrameLayers = projectData.frames[0].layers; 
           const layerIds = firstFrameLayers ? Object.keys(firstFrameLayers) : ["layer-1"];
           projectData.layers = layerIds.map((id: string, index: number) => ({
               id,
               name: `Layer ${index + 1}`,
               visible: true,
               locked: false,
               opacity: 100
           }));
      }

      // If frames are still empty or invalid, initialize defaults
      if (!projectData.frames || projectData.frames.length === 0) {
         const defaultLayerId = "layer-1";
         projectData.frames = [{
            id: "frame-1",
            layers: {
              [defaultLayerId]: Array(projectData.height).fill(null).map(() => Array(projectData.width).fill("transparent"))
            },
            duration: 100
         }];
         projectData.layers = [
            { id: defaultLayerId, name: "Layer 1", visible: true, locked: false, opacity: 100 }
         ];
      }

      setCanvasSize({ width: projectData.width, height: projectData.height });
      setCurrentProject(projectData);
    } catch (error) {
      console.error("Failed to load project", error);
      navigate("/dashboard"); // Redirect on error/unauthorized
    } finally {
      setIsLoading(false);
    }
  };


  const handleCanvasCreate = (width: number, height: number) => {
    setCanvasSize({ width, height });
    setShowDialog(false);
    
    // Initialize project in store
    const defaultLayerId = "layer-1";
    const newProject = {
      id: projectId || "temp-project",
      name: "New Project",
      width,
      height,
      layers: [
        { id: defaultLayerId, name: "Layer 1", visible: true, locked: false, opacity: 100 }
      ],
      frames: [{
        id: "frame-1",
        layers: {
          [defaultLayerId]: Array(height).fill(null).map(() => Array(width).fill("transparent"))
        },
        duration: 100
      }],
      isPublic: false,
      userId: "temp-user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setCurrentProject(newProject);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 4));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.1));
  const handleZoomReset = () => setZoom(1);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Determine panning: Middle mouse (button 1)
    if (e.button === 1 || e.shiftKey) {
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
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.max(0.1, Math.min(4, prev + delta)));
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#151316] text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#df4c16]"></div>
      </div>
    );
  }

  return (
    <>
      {showDialog && <CanvasSizeDialog onConfirm={handleCanvasCreate} />}

      <div className="h-screen flex flex-col bg-[#151316] text-white">
        <Header onNewFile={() => setShowDialog(true)} />
        <TopToolbar 
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
          mousePos={mousePos}
          canvasSize={canvasSize}
        />

        <main className="flex-1 flex overflow-hidden relative">
          {/* Tool Palette - Left Side (Compact) */}
          <ToolPalette compact className="w-14" />
          
          {/* Coordinate Display Overlay */}
          <div className="absolute top-4 left-20 z-10 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded text-xs font-mono text-white/80 pointer-events-none border border-white/10">
            {mousePos ? `${mousePos.x}, ${mousePos.y}` : `${canvasSize.width}x${canvasSize.height}px`}
          </div>

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
              onPixelHover={setMousePos}
            />
          </div>

          <RightSidebar className="w-80 flex-shrink-0" />
        </main>

        <Timeline />
      </div>
    </>
  );
}