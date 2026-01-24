import { create } from "zustand";
import { Project, Frame, Tool, Layer } from "../types";

interface EditorState {
  currentProject: Project | null;
  currentFrame: number;
  activeLayerId: string | null;
  selectedTool: Tool;
  primaryColor: string;
  secondaryColor: string;
  isPlaying: boolean;
  showOnionSkin: boolean;
  mirrorX: boolean;
  mirrorY: boolean;
  pixelPerfect: boolean;
  tileMode: boolean;
  tileLayout: { x: number, y: number };
  
  setCurrentProject: (project: Project | null) => void;
  setCurrentFrame: (frame: number) => void;
  setActiveLayer: (layerId: string) => void;
  setSelectedTool: (tool: Tool) => void;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
  setIsPlaying: (playing: boolean) => void;
  toggleOnionSkin: () => void;
  toggleMirrorX: () => void;
  toggleMirrorY: () => void;
  togglePixelPerfect: () => void;
  toggleTileMode: () => void;
  setTileLayout: (layout: { x: number, y: number }) => void;
  
  addFrame: () => void;
  duplicateFrame: (index: number) => void;
  deleteFrame: (index: number) => void;
  
  addLayer: () => void;
  deleteLayer: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  renameLayer: (id: string, name: string) => void;
  updateLayerOpacity: (id: string, opacity: number) => void;
  
  updatePixel: (frameIndex: number, x: number, y: number, color: string) => void;
  updatePixels: (frameIndex: number, updates: {x: number, y: number, color: string}[]) => void;
  updateSpecificLayerPixels: (frameIndex: number, layerId: string, updates: {x: number, y: number, color: string}[]) => void;
  undo: () => void;
  redo: () => void;
  pushToHistory: () => void;
  clearCanvas: () => void;
}

const createGrid = (width: number, height: number) => 
  Array(height).fill(null).map(() => Array(width).fill("transparent"));

// Simple history stack implementation
interface HistoryState {
  past: Project[];
  future: Project[];
}

export const useEditorStore = create<EditorState & HistoryState>((set, get) => {
  // Try to load from localStorage
  let savedState: Partial<EditorState> = {};
  try {
    const saved = localStorage.getItem("poxil-autosave-v2"); // Bumped version to invalidate old cache
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.currentProject) {
        
        let validActiveId = parsed.activeLayerId;
        // Validate that the active layer actually exists
        const layerExists = parsed.currentProject.layers?.find((l: Layer) => l.id === validActiveId);
        if (!layerExists && parsed.currentProject.layers?.length > 0) {
            validActiveId = parsed.currentProject.layers[0].id;
        }

        savedState = {
          currentProject: parsed.currentProject,
          activeLayerId: validActiveId,
          currentFrame: parsed.currentFrame ?? 0,
          selectedTool: parsed.selectedTool ?? { type: "pencil", size: 1 },
          primaryColor: parsed.primaryColor ?? "#000000",
          secondaryColor: parsed.secondaryColor ?? "#ffffff",
        };
      }
    }
  } catch (e) {
    console.error("Failed to load autosave:", e);
  }

  return {
  currentProject: null,
  currentFrame: 0,
  activeLayerId: null,
  selectedTool: { type: "pencil", size: 1 },
  primaryColor: "#000000",
  secondaryColor: "#ffffff",
  isPlaying: false,
  showOnionSkin: false,
  mirrorX: false,
  mirrorY: false,
  pixelPerfect: false,
  tileMode: false,
  tileLayout: { x: 3, y: 3 }, // Default 3x3
  past: [],
  future: [],
  
  ...savedState,

  setCurrentProject: (project) => set((state) => {
    let activeId = state.activeLayerId;
    if (project && project.layers && project.layers.length > 0) {
      activeId = project.layers[0].id;
    }
    // Reset history when loading new project
    return { currentProject: project, activeLayerId: activeId, past: [], future: [] };
  }),
  
  // History Helpers
  pushToHistory: () => {
     const state = get();
     if(state.currentProject) {
        // Limit history size to 20
        const newPast = [...state.past, JSON.parse(JSON.stringify(state.currentProject))]; 
        if(newPast.length > 20) newPast.shift();
        
        set({ past: newPast, future: [] });
     }
  },

  undo: () => set((state) => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, state.past.length - 1);
      
      if (!state.currentProject) return state;
      
      return {
          past: newPast,
          future: [state.currentProject, ...state.future],
          currentProject: previous
      };
  }),

  redo: () => set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      
      if (!state.currentProject) return state;

      return {
          past: [...state.past, state.currentProject],
          future: newFuture,
          currentProject: next
      };
  }),

  clearCanvas: () => set((state) => {
     if (!state.currentProject || !state.activeLayerId) return state;
     
     // Save state for undo
     const currentProj = JSON.parse(JSON.stringify(state.currentProject));
     
     // Clear only active layer on current frame
     const frame = state.currentProject.frames[state.currentFrame];
     const newGrid = createGrid(state.currentProject.width, state.currentProject.height);
     
     const newFrame = {
         ...frame,
         layers: {
             ...frame.layers,
             [state.activeLayerId]: newGrid
         }
     };
     
     const newFrames = [...state.currentProject.frames];
     newFrames[state.currentFrame] = newFrame;
     
     return {
         past: [...state.past, currentProj],
         future: [],
         currentProject: {
             ...state.currentProject,
             frames: newFrames
         }
     };
  }),

  setCurrentFrame: (frame) => set({ currentFrame: frame }),
  setActiveLayer: (layerId) => set({ activeLayerId: layerId }),
  setSelectedTool: (tool) => set({ selectedTool: tool }),
  setPrimaryColor: (color) => set({ primaryColor: color }),
  setSecondaryColor: (color) => set({ secondaryColor: color }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  toggleOnionSkin: () => set((state) => ({ showOnionSkin: !state.showOnionSkin })),
  toggleMirrorX: () => set((state) => ({ mirrorX: !state.mirrorX })),
  toggleMirrorY: () => set((state) => ({ mirrorY: !state.mirrorY })),
  toggleTileMode: () => set((state) => ({ tileMode: !state.tileMode })),
  togglePixelPerfect: () => set((state) => ({ pixelPerfect: !state.pixelPerfect })),
  setTileLayout: (layout) => set({ tileLayout: layout }),
  
  addFrame: () =>
    set((state) => {
      if (!state.currentProject) return state;
      const historyProj = JSON.parse(JSON.stringify(state.currentProject)); // Snapshot
      
      const newFrame: Frame = {
        id: crypto.randomUUID(),
        duration: 100,
        layers: {}
      };
      
      // Initialize grids for all existing layers
      state.currentProject.layers.forEach(layer => {
        newFrame.layers[layer.id] = createGrid(state.currentProject!.width, state.currentProject!.height);
      });

      return {
        past: [...state.past, historyProj],
        future: [],
        currentProject: {
          ...state.currentProject,
          frames: [...state.currentProject.frames, newFrame],
        },
        currentFrame: state.currentProject.frames.length // Switch to new frame
      };
    }),

  duplicateFrame: (index: number) =>
    set((state) => {
        if (!state.currentProject) return state;
        const historyProj = JSON.parse(JSON.stringify(state.currentProject)); // Snapshot
        
        const sourceFrame = state.currentProject.frames[index];
        if (!sourceFrame) return state;

        // Deep copy layers
        const newLayers: Record<string, string[][]> = {};
        Object.entries(sourceFrame.layers).forEach(([layerId, grid]) => {
            newLayers[layerId] = grid.map(row => [...row]);
        });

        const newFrame: Frame = {
            id: crypto.randomUUID(),
            duration: sourceFrame.duration,
            layers: newLayers
        };

        const newFrames = [...state.currentProject.frames];
        newFrames.splice(index + 1, 0, newFrame);

        return {
            past: [...state.past, historyProj],
            future: [],
            currentProject: {
                ...state.currentProject,
                frames: newFrames
            },
            currentFrame: index + 1
        };
    }),

  deleteFrame: (index) =>
    set((state) => {
      if (!state.currentProject || state.currentProject.frames.length <= 1) return state;
      const historyProj = JSON.parse(JSON.stringify(state.currentProject)); // Snapshot

      const frames = state.currentProject.frames.filter((_, i) => i !== index);
      return {
        past: [...state.past, historyProj],
        future: [],
        currentProject: { ...state.currentProject, frames },
        currentFrame: Math.min(state.currentFrame, frames.length - 1),
      };
    }),

  addLayer: () => 
    set((state) => {
      if (!state.currentProject) return state;
      const historyProj = JSON.parse(JSON.stringify(state.currentProject)); // Snapshot
      
      const newLayer: Layer = {
        id: crypto.randomUUID(),
        name: `Layer ${state.currentProject.layers.length + 1}`,
        visible: true,
        locked: false,
        opacity: 100
      };
      
      const updatedFrames = state.currentProject.frames.map(frame => ({
        ...frame,
        layers: {
          ...frame.layers,
          [newLayer.id]: createGrid(state.currentProject!.width, state.currentProject!.height)
        }
      }));
      
      return {
        past: [...state.past, historyProj],
        future: [],
        currentProject: {
          ...state.currentProject,
          layers: [newLayer, ...state.currentProject.layers],
          frames: updatedFrames
        },
        activeLayerId: newLayer.id
      };
    }),

  deleteLayer: (id) =>
    set((state) => {
      if (!state.currentProject || state.currentProject.layers.length <= 1) return state;
      const historyProj = JSON.parse(JSON.stringify(state.currentProject)); // Snapshot
      
      const newLayers = state.currentProject.layers.filter(l => l.id !== id);
      
      const updatedFrames = state.currentProject.frames.map(frame => {
        const newLayersMap = { ...frame.layers };
        delete newLayersMap[id];
        return { ...frame, layers: newLayersMap };
      });
      
      let newActiveId = state.activeLayerId;
      if (state.activeLayerId === id) {
        newActiveId = newLayers[0].id;
      }
      
      return {
        past: [...state.past, historyProj],
        future: [],
        currentProject: {
          ...state.currentProject,
          layers: newLayers,
          frames: updatedFrames
        },
        activeLayerId: newActiveId
      };
    }),

  toggleLayerVisibility: (id) =>
    set((state) => {
      if (!state.currentProject) return state;
      const newLayers = state.currentProject.layers.map(l => 
        l.id === id ? { ...l, visible: !l.visible } : l
      );
      return { currentProject: { ...state.currentProject, layers: newLayers } };
    }),

  toggleLayerLock: (id) =>
    set((state) => {
      if (!state.currentProject) return state;
      const newLayers = state.currentProject.layers.map(l => 
        l.id === id ? { ...l, locked: !l.locked } : l
      );
      return { currentProject: { ...state.currentProject, layers: newLayers } };
    }),

  renameLayer: (id, name) =>
    set((state) => {
      if (!state.currentProject) return state;
      const newLayers = state.currentProject.layers.map(l => 
        l.id === id ? { ...l, name } : l
      );
      return { currentProject: { ...state.currentProject, layers: newLayers } };
    }),

  updateLayerOpacity: (id, opacity) =>
    set((state) => {
      if (!state.currentProject) return state;
      const previous = JSON.parse(JSON.stringify(state.currentProject)); // Debouncing might be better here but simple history for now
      // Actually opacity change is frequent, maybe don't push to history on every drag?
      // For now we don't push history for opacity to avoid spam
      const newLayers = state.currentProject.layers.map(l => 
        l.id === id ? { ...l, opacity } : l
      );
      return { currentProject: { ...state.currentProject, layers: newLayers } };
    }),

  updatePixel: (frameIndex, x, y, color) =>
    set((state) => {
      if (!state.currentProject || !state.activeLayerId) return state;
      
      const layer = state.currentProject.layers.find(l => l.id === state.activeLayerId);
      if (layer?.locked || !layer?.visible) return state;

      // NOTE: History logic moved to InteractiveCanvas.tsx (e.g., onMouseDown) 
      // OR we just assume every batch of drawing updates *one* history state?
      // Since updatePixel is called PER PIXEL during drag, we cannot push history here.
      // We need a separate 'commitAction' or manipulate 'past' in UI component.
      // FIX: Implementation of history for Drawing needs to happen at "MouseUp" level in component
      // OR we provide a method to snapshot state.
      
      const frames = [...state.currentProject.frames];
      const frameCode = frames[frameIndex];
      if (!frameCode.layers[state.activeLayerId]) {
         frameCode.layers[state.activeLayerId] = createGrid(state.currentProject.width, state.currentProject.height);
      }

      const layerGrid = frameCode.layers[state.activeLayerId].map(row => [...row]);
      layerGrid[y][x] = color;
      
      const updatedFrame = {
        ...frameCode,
        layers: {
          ...frameCode.layers,
          [state.activeLayerId]: layerGrid
        }
      };
      
      frames[frameIndex] = updatedFrame;
      // Important for reactivity: We must ensure currentProject is a NEW object reference
      return { 
        currentProject: { 
           ...state.currentProject, 
           frames 
        } 
      };
    }),

  updatePixels: (frameIndex, updates) =>
    set((state) => {
      if (!state.currentProject || !state.activeLayerId) return state;
      
      const layer = state.currentProject.layers.find(l => l.id === state.activeLayerId);
      if (layer?.locked || !layer?.visible) return state;

      const frames = [...state.currentProject.frames];
      const frameCode = frames[frameIndex];
      if (!frameCode.layers[state.activeLayerId]) {
         frameCode.layers[state.activeLayerId] = createGrid(state.currentProject.width, state.currentProject.height);
      }

      const layerGrid = frameCode.layers[state.activeLayerId].map(row => [...row]);
      
      updates.forEach(({x, y, color}) => {
         if (layerGrid[y] && layerGrid[y][x] !== undefined) {
             layerGrid[y][x] = color;
         }
      });
      
      const updatedFrame = {
        ...frameCode,
        layers: {
          ...frameCode.layers,
          [state.activeLayerId]: layerGrid
        }
      };
      
      frames[frameIndex] = updatedFrame;
      // Important for reactivity: We must ensure currentProject is a NEW object reference
      return { 
        currentProject: { 
           ...state.currentProject, 
           frames 
        } 
      };
    }),

  updateSpecificLayerPixels: (frameIndex, layerId, updates) =>
    set((state) => {
      if (!state.currentProject) return state;
      
      const frames = [...state.currentProject.frames];
      const frameCode = frames[frameIndex];
      if (!frameCode || !frameCode.layers[layerId]) return state; 

      const layerGrid = frameCode.layers[layerId].map(row => [...row]);
      
      updates.forEach(({x, y, color}) => {
         if (layerGrid[y] && layerGrid[y][x] !== undefined) {
             layerGrid[y][x] = color;
         }
      });
      
      const updatedFrame = {
        ...frameCode,
        layers: {
          ...frameCode.layers,
          [layerId]: layerGrid
        }
      };
      
      frames[frameIndex] = updatedFrame;
      return { 
        currentProject: { 
           ...state.currentProject, 
           frames 
        } 
      };
    }),
  };
});


// Debounce helper
const debounce = (fn: Function, ms: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
};

// Auto-save subscription with debounce
const saveState = debounce((state: EditorState) => {
  if (state.currentProject) {
    const stateToSave = {
      currentProject: state.currentProject,
      activeLayerId: state.activeLayerId,
      currentFrame: state.currentFrame,
      selectedTool: state.selectedTool,
      primaryColor: state.primaryColor,
      secondaryColor: state.secondaryColor,
    };
    try {
      localStorage.setItem("poxil-autosave-v2", JSON.stringify(stateToSave));
    } catch (e) {
      console.warn("Failed to save state to localStorage", e);
    }
  }
}, 1000); // Save after 1 second of inactivity

useEditorStore.subscribe((state) => {
  saveState(state);
});
