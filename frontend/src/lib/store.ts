import { create } from "zustand";
import { Project, Frame, Tool } from "../types";

interface EditorState {
  currentProject: Project | null;
  currentFrame: number;
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
  setSelectedTool: (tool: Tool) => void;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
  setIsPlaying: (playing: boolean) => void;
  toggleOnionSkin: () => void;
  toggleMirrorX: () => void;
  toggleMirrorY: () => void;
  togglePixelPerfect: () => void;
  addFrame: () => void;
  deleteFrame: (index: number) => void;
  updatePixel: (frameIndex: number, x: number, y: number, color: string) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  currentProject: null,
  currentFrame: 0,
  selectedTool: { type: "pencil", size: 1 },
  primaryColor: "#000000",
  secondaryColor: "#ffffff",
  isPlaying: false,
  showOnionSkin: false,
  mirrorX: false,
  mirrorY: false,
  pixelPerfect: false,

  setCurrentProject: (project) => set({ currentProject: project }),
  setCurrentFrame: (frame) => set({ currentFrame: frame }),
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
        pixels: Array(state.currentProject.height)
          .fill(null)
          .map(() => Array(state.currentProject!.width).fill("transparent")),
        duration: 100,
      };
      return {
        currentProject: {
          ...state.currentProject,
          frames: [...state.currentProject.frames, newFrame],
        },
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

  updatePixel: (frameIndex, x, y, color) =>
    set((state) => {
      if (!state.currentProject) return state;
      const frames = [...state.currentProject.frames];
      const frame = { ...frames[frameIndex] };
      const pixels = frame.pixels.map((row) => [...row]);
      pixels[y][x] = color;
      frame.pixels = pixels;
      frames[frameIndex] = frame;
      return { currentProject: { ...state.currentProject, frames } };
    }),
}));
