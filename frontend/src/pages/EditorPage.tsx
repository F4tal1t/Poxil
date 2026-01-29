import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import Timeline from "../components/Timeline";
import { useEditorStore } from "../lib/store";
import { socket } from "../lib/socket";
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
  const [showAuthDialog, setShowAuthDialog] = useState(false); // For Save Prompt
  const [isSaving, setIsSaving] = useState(false);

  const { setCurrentProject, updatePixels, updatePixel, updateSpecificLayerPixels } = useEditorStore();
  const pixelSize = 16;

  // Protect editor route for non-guest users
  if (!isSessionLoading && !session && projectId !== 'guest') {
      return <Navigate to="/login" />;
  }

  // Cleanup effect
  useEffect(() => {
     return () => {
         // Optionally clear store or connections here
     };
  }, []);

  // Manual Save Handler
  const handleManualSave = useCallback(async () => {
    const state = useEditorStore.getState();
    const currentProject = state.currentProject;
    
    // GUEST Check
    if (!session?.user || projectId === 'guest') {
      setShowAuthDialog(true);
      return;
    }

    // AUTH Saved
    // Only check socket if we're not a guest and assume we're online
    if (!socket.connected) {
      alert("You appear to be offline. Cannot save to cloud.");
      return;
    }

    setIsSaving(true);
    try {
        await axios.put(`${import.meta.env.VITE_API_URL || "/api"}/projects/${projectId}`, {
          frames: state.currentProject?.frames,
          layers: state.currentProject?.layers,
          width: currentProject?.width,
          height: currentProject?.height
        });
        console.log("Manual save successful");
    } catch (e) {
        console.error("Save failed", e);
        alert("Failed to save project.");
    } finally {
        setIsSaving(false);
    }
  }, [projectId, session]);

  // Global Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Ignore if input focused (except for Ctrl+S)
        const isInput = ["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName);

        // Ctrl+S (Save) - allow even if input is focused
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            handleManualSave();
            return;
        }

        if (isInput) return;

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
  }, [handleManualSave]);

  // Auto-Save Logic (Every 1 minute)
  useEffect(() => {
    const interval = setInterval(async () => {
        const state = useEditorStore.getState();
        const proj = state.currentProject;
        
        // GUEST AUTO-SAVE (Local Storage)
        const isGuest = !session?.user || projectId === 'guest';
        if (isGuest) {
            if (proj) {
                const projectData = { 
                    ...proj, 
                    frames: state.currentProject?.frames, 
                    layers: state.currentProject?.layers,
                    width: proj.width,
                    height: proj.height
                };
                localStorage.setItem('poxil_guest_project', JSON.stringify(projectData));
                console.log("Guest state saved locally.");
            }
            return;
        }

        // "polling wont happen when the user is disconnected"
        if (!socket.connected) return;
        
        if (!projectId || !proj) return;

        try {
            console.log("Auto-saving project...");
            await axios.put(`/api/projects/${projectId}`, {
                frames: state.currentProject?.frames,
                layers: state.currentProject?.layers,
                width: proj.width,
                height: proj.height
            });
        } catch (error) {
            console.error("Auto-save failed", error);
        }
    }, 60 * 1000); // 1 minute

    return () => clearInterval(interval);
  }, [projectId, session]);

  // Socket Connection
  useEffect(() => {
    // Determine loading state of project logic
    const loadGuestOrAuthProject = async () => {
         // Guest Project Loading
        if (projectId === 'guest') {
             console.log("Loading guest session...");
             const local = localStorage.getItem('poxil_guest_project');
             if (local) {
                 try {
                     const data = JSON.parse(local);
                     if (data) {
                         useEditorStore.getState().setCurrentProject(data);
                         setCanvasSize({ width: data.width, height: data.height });
                         setShowDialog(false);
                     }
                 } catch(e) {
                     console.error("Failed to load local guest data", e);
                 }
             } else {
                 // Initialize default new project for guest
                 useEditorStore.getState().setCurrentProject({
                     id: 'guest',
                     name: 'Guest Project',
                     width: 32, 
                     height: 32,
                     frames: [{ id: 'frame-1', layers: { 'layer-1': Array(32).fill(null).map(() => Array(32).fill("transparent")) }, duration: 100 }],
                     layers: [{ id: 'layer-1', name: 'Layer 1', visible: true, locked: false, opacity: 100 }],
                     createdAt: new Date().toISOString(),
                     updatedAt: new Date().toISOString(),
                     userId: 'guest',
                     isPublic: false
                 });
                 // Ensure canvas size matches
                 setCanvasSize({ width: 32, height: 32 });
             }
             setIsLoading(false);
             return; 
        }

        // Authenticated Project Loading
        try {
            if (isSessionLoading) return;
            
            const response = await axios.get(`${import.meta.env.VITE_API_URL || "/api"}/projects/${projectId}`);
            useEditorStore.getState().setCurrentProject(response.data);
            setCanvasSize({ width: response.data.width, height: response.data.height });
            setShowDialog(false);
            setIsLoading(false);

        } catch (error) {
            console.error("Failed to load project:", error);
            setIsLoading(false);
        }
    };

    if (projectId) {
        loadGuestOrAuthProject();
    }
  }, [projectId, isSessionLoading]);


  // Socket Connection Effect
  useEffect(() => {
    if (!projectId || isSessionLoading) return;
    if (projectId === 'guest') return; 
    
    // Determine identity
    const hasIdentity = !!session?.user;
    
    if (!hasIdentity) {
        return;
    }
    
    // We have an identity, ensure dialog is closed
    setShowGuestDialog(false);

    const userName = session?.user?.name || guestName || "Guest";
    const userId = session?.user?.id || `guest-${guestName}-${Math.floor(Math.random() * 1000)}`;

    socket.connect();
    
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

  // Handlers from the original file (restored)
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
        <img src="/Loader.gif" alt="Loading..." className="h-32 w-32" />
      </div>
    );
  }

  return (
    <>
      {showDialog && <CanvasSizeDialog onConfirm={handleCanvasCreate} />}

      <div className="h-screen flex flex-col bg-[#151316] text-white">
        <GuestNameDialog isOpen={showGuestDialog} onSubmit={setGuestName} />
        {/* Pass props to Header for Save Button state */}
        {/* @ts-ignore */}
        <Header 
          isGuest={!session?.user || projectId === 'guest'} 
          onSave={handleManualSave} 
          isSaving={isSaving}
          onNewFile={() => setShowDialog(true)}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitToScreen={handleZoomReset}
        />
        
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
        
        {/* Guest Save Dialog */}
        {showAuthDialog && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                <div className="bg-[#151316] border border-[#333] p-8 rounded-2xl max-w-sm w-full shadow-2xl text-center">
                    <div className="w-16 h-16 bg-[#df4c16]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-[#df4c16]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold mb-2">Save to Cloud?</h2>
                    <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                        Create a free account to save your projects permanently, access them from any device, and collaborate with friends.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => {
                                // Save local state one last time before redirect
                                const state = useEditorStore.getState();
                                localStorage.setItem('poxil_guest_project', JSON.stringify({
                                    frames: state.currentProject?.frames,
                                    layers: state.currentProject?.layers,
                                    width: state.currentProject?.width,
                                    height: state.currentProject?.height
                                }));
                                navigate('/login'); 
                            }}
                            className="w-full py-3 bg-[#df4c16] text-white font-bold rounded-lg hover:bg-[#c93b0b] transition-colors"
                        >
                            Log In / Sign Up
                        </button>
                        <button 
                            onClick={() => setShowAuthDialog(false)}
                            className="w-full py-3 text-gray-500 hover:text-white transition-colors"
                        >
                            Continue as Guest
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </>
  );
}
