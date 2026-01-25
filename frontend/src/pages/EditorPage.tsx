import { useState, useEffect , useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Timeline from "../components/Timeline";
import { useEditorStore } from "../lib/store";
import { socket } from "../lib/socket"; // Import socket
import { useSession } from "../lib/auth";
import GuestNameDialog from "../components/GuestNameDialog";
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
  
  // Auth & Guest State
  const { data: session, isPending: isSessionLoading } = useSession();
  const [guestName, setGuestName] = useState<string | null>(null);
  const [showGuestDialog, setShowGuestDialog] = useState(false);

  const { setCurrentProject, updatePixels, updatePixel, updateSpecificLayerPixels } = useEditorStore();
  const pixelSize = 16;

  // Cleanup effect
  useEffect(() => {
     return () => {
         // Optionally clear store or connections here
     };
  }, []);

  // Global Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Ignore if input focused
        if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;

        const store = useEditorStore.getState();
        const { undo, redo, setSelectedTool } = store;

        // Undo / Redo
        if (e.ctrlKey) {
            if (e.key === 'z') {
                e.preventDefault();
                undo();
            } else if (e.key === 'y' || (e.shiftKey && e.key === 'Z')) {
                e.preventDefault();
                redo();
            }
        }

        // Tools
        switch(e.key.toLowerCase()) {
            case 'p': setSelectedTool({ ...store.selectedTool, type: 'pencil' }); break;
            case 'e': setSelectedTool({ ...store.selectedTool, type: 'eraser' }); break;
            case 'f': setSelectedTool({ ...store.selectedTool, type: 'fill' }); break;
            case 'l': setSelectedTool({ ...store.selectedTool, type: 'line' }); break;
            case 'r': setSelectedTool({ ...store.selectedTool, type: 'rectangle' }); break;
            case 'c': setSelectedTool({ ...store.selectedTool, type: 'circle' }); break;
            case 'i': setSelectedTool({ ...store.selectedTool, type: 'picker' }); break;
            case 's': setSelectedTool({ ...store.selectedTool, type: 'selection' }); break;
            case 'm': setSelectedTool({ ...store.selectedTool, type: 'selection' }); break; // M for marquee often used
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-Save Logic (Every 1 minute)
  useEffect(() => {
    const interval = setInterval(async () => {
        // "polling wont happen when the user is disconnected"
        if (!socket.connected) return;
        
        const proj = useEditorStore.getState().currentProject;
        if (!projectId || !proj) return;

        try {
            console.log("Auto-saving project...");
            await axios.put(`/api/projects/${projectId}`, {
                frames: proj.frames,
                layers: proj.layers,
                width: proj.width,
                height: proj.height
            });
        } catch (error) {
            console.error("Auto-save failed", error);
        }
    }, 60 * 1000); // 1 minute

    return () => clearInterval(interval);
  }, [projectId]);

  // Socket Connection
  useEffect(() => {
    if (!projectId || isSessionLoading) return;

    // Determine identity
    const hasIdentity = !!session?.user || !!guestName;
    
    if (!hasIdentity) {
         setShowGuestDialog(true);
         return;
    }
    
    // We have an identity, ensure dialog is closed
    setShowGuestDialog(false);

    const userName = session?.user?.name || guestName || "Guest";
    const userId = session?.user?.id || `guest-${guestName}-${Math.floor(Math.random() * 1000)}`;

    socket.connect();
    
    // Slight delay to ensure connection? No, connect() is async but emits are queued usually.
    socket.emit("join-project", { 
        projectId, 
        user: { name: userName, id: userId } 
    });

    const handlePixelUpdate = (data: any) => {
       if (data.updates && Array.isArray(data.updates)) {
           useEditorStore.getState().updateSpecificLayerPixels(data.frameIndex, data.layerId, data.updates);
       } else if (data.x !== undefined) {
           if (data.layerId) {
               useEditorStore.getState().updateSpecificLayerPixels(data.frameIndex || 0, data.layerId, [{x: data.x, y: data.y, color: data.color}]);
           }
       }
    };
    
    socket.on("pixel-update", handlePixelUpdate);

    return () => {
      socket.off("pixel-update");
      socket.emit("leave-project", projectId);
      socket.disconnect();
    };
  }, [projectId, session, guestName, isSessionLoading]);

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
      useEditorStore.getState().setCurrentProject(projectData);
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
    
    useEditorStore.getState().setCurrentProject(newProject);
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
        <img src="/Loader.gif" alt="Loading..." className="h-16 w-16" />
      </div>
    );
  }

  return (
    <>
      {showDialog && <CanvasSizeDialog onConfirm={handleCanvasCreate} />}

      <div className="h-screen flex flex-col bg-[#151316] text-white">
        <GuestNameDialog isOpen={showGuestDialog} onSubmit={setGuestName} />
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