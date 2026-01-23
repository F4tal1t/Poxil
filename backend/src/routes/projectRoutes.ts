import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import * as projectController from "../controllers/projectController.js";

const router = Router();

const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).nullish(),
    width: z.number().int().min(8).max(512).optional(),
    height: z.number().int().min(8).max(512).optional(),
    frames: z.any().optional(), // Added support for initial frames
    layers: z.any().optional(), // Added support for initial layers
  }),
});

const updateProjectSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().optional(),
    description: z.any().optional(),
    width: z.number().int().min(8).max(512).optional(), // Added width
    height: z.number().int().min(8).max(512).optional(), // Added height
    frames: z.any().optional(),
    layers: z.any().optional(),
    isPublic: z.boolean().optional(),
  }),
});

router.post("/", requireAuth, validate(createProjectSchema), projectController.createProject);
router.get("/", requireAuth, projectController.getProjects);
router.get("/:id", requireAuth, projectController.getProject);
router.put("/:id", requireAuth, validate(updateProjectSchema), projectController.updateProject);
router.delete("/:id", requireAuth, projectController.deleteProject);

export default router;
