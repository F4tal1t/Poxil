import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { prisma } from "../config/database.js";

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    // Extract variables from body first to fix scope errors
    const { name, description, frames, layers } = req.body;
    const width = req.body.width || 32;
    const height = req.body.height || 32;
    
    // Create initial Grid with transparent strings
    const createGrid = (w: number, h: number) => Array(h).fill(null).map(() => Array(w).fill("transparent"));
    
    const layerId = "layer-1";
    const initialLayers = [{ id: layerId, name: "Layer 1", visible: true, locked: false, opacity: 100 }];
    const initialFrames = [{
        id: "frame-1",
        layers: {
             [layerId]: createGrid(width, height)
        },
        duration: 100
    }];

    const project = await prisma.project.create({
      data: {
        name,
        description,
        width,
        height,
        frames: frames || initialFrames, 
        layers: layers || initialLayers,
        userId: req.user!.id,
      },
    });

    return res.status(201).json(project);
  } catch (error) {
    console.error("Create project error:", error); // Log detailed error
    return res.status(500).json({ error: "Failed to create project" });
  }
};

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.id },
      orderBy: { updatedAt: "desc" },
    });

    return res.json(projects);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch projects" });
  }
};

export const getProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // Allow undefined
    
    const project = await prisma.project.findFirst({
      where: {
        id,
      },
      include: {
        user: {
            select: { name: true, email: true }
        }
      }
    });

    if (!project) {
        return res.status(404).json({ message: "Project not found" });
    }

    // Access Control: Allow if Owner OR Public
    const isOwner = userId && project.userId === userId;
    const isPublic = project.isPublic;

    if (!isOwner && !isPublic) {
        return res.status(403).json({ message: "Unauthorized access: Private project" });
    }

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    return res.json(project);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch project" });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`Updating project ${id}. Width: ${req.body.width}, Height: ${req.body.height}`); // Debug log
    const { name, description, width, height, frames, layers, isPublic } = req.body;

    const project = await prisma.project.updateMany({
      where: { id, userId: req.user!.id },
      data: { name, description, width, height, frames, layers, isPublic },
    });

    if (project.count === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    return res.json({ message: "Project updated successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update project" });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.deleteMany({
      where: { id, userId: req.user!.id },
    });

    if (project.count === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    return res.json({ message: "Project deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete project" });
  }
};
