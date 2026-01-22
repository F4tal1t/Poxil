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
  
  addFrame: () => void;
  duplicateFrame: (index: number) => void;
  deleteFrame: (index: number) => void;
  
  addLayer: () => void;
  deleteLayer: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  updateLayerOpacity: (id: string, opacity: number) => void;
  
  updatePixel: (frameIndex: number, x: number, y: number, color: string) => void;
}

const createGrid = (width: number, height: number) => 
  Array(height).fill(null).map(() => Array(width).fill("transparent"));

export const useEditorStore = create<EditorState>((set) => ({
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

  setCurrentProject: (project) => set((state) => {
    let activeId = state.activeLayerId;
    if (project && project.layers && project.layers.length > 0) {
      activeId = project.layers[0].id;
    }
    return { currentProject: project, activeLayerId: activeId };
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
  togglePixelPerfect: () => set((state) => ({ pixelPerfect: !state.pixelPerfect })),
  
  addFrame: () =>
    set((state) => {
      if (!state.currentProject) return state;
      
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
      const frames = state.currentProject.frames.filter((_, i) => i !== index);
      return {
        currentProject: { ...state.currentProject, frames },
        currentFrame: Math.min(state.currentFrame, frames.length - 1),
      };
    }),

  addLayer: () => 
    set((state) => {
      if (!state.currentProject) return state;
      
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

  updateLayerOpacity: (id, opacity) =>
    set((state) => {
      if (!state.currentProject) return state;
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

      const frames = [...state.currentProject.frames];
      const frameCode = frames[frameIndex];
      // Defensive coding in case layer data is missing
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
      return { currentProject: { ...state.currentProject, frames } };
    }),
}));