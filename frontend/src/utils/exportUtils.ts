import { Project } from "../types";

export const exportProjectAsImage = (project: Project | null) => {
  if (!project) return;
  
  // Create a temporary canvas
  const canvas = document.createElement("canvas");
  canvas.width = project.width;
  canvas.height = project.height;
  const ctx = canvas.getContext("2d");
  
  if (!ctx) return;

  // Get the first frame (or current frame logic if you prefer)
  const frame = project.frames[0]; 

  // Draw pixels
  frame.pixels.forEach((row, y) => {
    row.forEach((color, x) => {
      if (color && color !== "transparent") {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    });
  });

  // Convert to data URL and trigger download
  const link = document.createElement("a");
  link.download = `${project.name || "untitled"}.png`;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
