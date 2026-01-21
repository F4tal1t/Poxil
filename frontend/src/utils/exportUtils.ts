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
  const layers = project.layers || [];

  // Draw background first
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw pixels from all visible layers
  [...layers].reverse().forEach(layer => {
    if (!layer.visible) return;
    const grid = frame.layers[layer.id];
    if (!grid) return;

    ctx.globalAlpha = layer.opacity / 100;
    
    grid.forEach((row, y) => {
      row.forEach((color, x) => {
        if (color && color !== "transparent") {
          ctx.fillStyle = color;
          // Scale the position and size of each pixel
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      });
    });
    
    ctx.globalAlpha = 1.0;
  });

  // Convert to data URL and trigger download
  const link = document.createElement("a");
  link.download = `${project.name || "untitled"}.png`;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
