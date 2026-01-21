import { Project } from "../types";

export const exportProjectAsImage = (project: Project | null, scale: number = 1) => {
  if (!project) return;
  
  // Create a temporary canvas
  const canvas = document.createElement("canvas");
  canvas.width = project.width * scale;
  canvas.height = project.height * scale;
  const ctx = canvas.getContext("2d");
  
  if (!ctx) return;

  // Ensure pixel art remains crisp
  ctx.imageSmoothingEnabled = false;

  // Get the first frame (or current frame logic if you prefer)
  const frame = project.frames[0]; 

  // Draw pixels
  frame.pixels.forEach((row, y) => {
    row.forEach((color, x) => {
      if (color && color !== "transparent") {
        ctx.fillStyle = color;
        // Scale the position and size of each pixel
        ctx.fillRect(x * scale, y * scale, scale, scale);
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
