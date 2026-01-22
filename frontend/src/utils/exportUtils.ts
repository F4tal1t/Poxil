import { Project } from "../types";
// @ts-ignore
import gifshot from "gifshot";

// Helper to render a specific frame to a data URL
const renderFrameToDataUrl = (project: Project, frameIndex: number, scale: number): string | null => {
  const canvas = document.createElement("canvas");
  canvas.width = project.width * scale;
  canvas.height = project.height * scale;
  const ctx = canvas.getContext("2d");
  
  if (!ctx) return null;

  ctx.imageSmoothingEnabled = false;

  const frame = project.frames[frameIndex];
  const layers = project.layers || [];

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw layers
  [...layers].reverse().forEach(layer => {
    if (!layer.visible) return;
    const grid = frame.layers[layer.id];
    if (!grid) return;

    ctx.globalAlpha = layer.opacity / 100;
    
    grid.forEach((row, y) => {
      row.forEach((color, x) => {
        if (color && color !== "transparent") {
          ctx.fillStyle = color;
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      });
    });
    
    ctx.globalAlpha = 1.0;
  });

  return canvas.toDataURL("image/png");
};

export const exportProjectAsImage = (project: Project | null, scale: number = 1) => {
  if (!project) return;
  
  const dataUrl = renderFrameToDataUrl(project, 0, scale); // Export first frame usually, or pass frame index
  if (!dataUrl) return;

  const link = document.createElement("a");
  link.download = `${project.name || "untitled"}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportProjectAsGif = (project: Project | null, scale: number = 1, fps: number = 12) => {
    if (!project) return;

    const images: string[] = [];
    project.frames.forEach((_, index) => {
        const url = renderFrameToDataUrl(project, index, scale);
        if (url) images.push(url);
    });

    if (images.length === 0) return;

    const width = project.width * scale;
    const height = project.height * scale;

    gifshot.createGIF({
        images: images,
        interval: 1 / fps,
        gifWidth: width,
        gifHeight: height,
        numWorkers: 2,
    }, (obj: any) => {
        if (!obj.error) {
            const image = obj.image;
            const link = document.createElement("a");
            link.download = `${project.name || "animation"}.gif`;
            link.href = image;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            console.error("GIF Export failed:", obj.errorMsg);
            alert("Failed to export GIF");
        }
    });
};
