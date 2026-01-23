import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { prisma } from "../config/database.js";

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, width, height, frames, layers } = req.body;
    
    const project = await prisma.project.create({
      data: {
        name,
        description,
        width: width || 32,
        height: height || 32,
        frames: frames || [], // Save frames if provided
        layers: layers || [], // Save layers if provided
        userId: req.user!.id,
      },
    });

    res.status(201).json(project);
  } catch (error) {
    console.error("Create project error:", error); // Log detailed error
    res.status(500).json({ error: "Failed to create project" });
  }
};

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.id },
      orderBy: { updatedAt: "desc" },
    });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};

export const getProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const project = await prisma.project.findFirst({
      where: {
        id,
        OR: [{ userId: req.user!.id }, { isPublic: true }],
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch project" });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    // console.log(`Updating project ${id} with body:`, JSON.stringify(req.body, null, 2)); // Debug log removed
    const { name, description, frames, layers, isPublic } = req.body;

    const project = await prisma.project.updateMany({
      where: { id, userId: req.user!.id },
      data: { name, description, frames, layers, isPublic },
    });

    if (project.count === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ message: "Project updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update project" });
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

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete project" });
  }
};
