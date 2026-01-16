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
  frames: Frame[];
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Frame {
  id: string;
  pixels: string[][];
  duration: number;
}

export interface Tool {
  type: "pencil" | "eraser" | "picker" | "fill" | "line" | "rectangle";
  size: number;
}

export interface PixelUpdate {
  projectId: string;
  frameId: string;
  x: number;
  y: number;
  color: string;
}
