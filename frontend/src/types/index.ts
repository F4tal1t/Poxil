export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  width: number;
  height: number;
  layers: Layer[];
  frames: Frame[];
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
}

export interface Frame {
  id: string;
  // Map of LayerID -> Method of storing pixels
  // We keep it flat as possible or mapped
  layers: Record<string, string[][]>;
  duration: number;
}

export interface Tool {
  type: "pencil" | "eraser" | "picker" | "fill" | "line" | "rectangle" | "circle";
  size: number;
}

export interface PixelUpdate {
  projectId: string;
  frameId: string;
  x: number;
  y: number;
  color: string;
}
