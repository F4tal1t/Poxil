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

  // Background (Transparent)
  ctx.clearRect(0, 0, canvas.width, canvas.height);

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


export const exportProjectAsSvg = (project: Project | null, scale: number = 1) => {
    if (!project) return;
    
    const width = project.width;
    const height = project.height;
    
    // Start SVG string
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width * scale}" height="${height * scale}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">`;
    
    // Render Frame 0 Layers
    const frame = project.frames[0];
    const layers = project.layers || [];
    
    [...layers].reverse().forEach(layer => {
        if (!layer.visible) return;
        const grid = frame.layers[layer.id];
        if (!grid) return;

        // Group for layer opacity
        if (layer.opacity < 100) {
            svgContent += `<g opacity="${layer.opacity / 100}">`;
        }

        grid.forEach((row, y) => {
            row.forEach((color, x) => {
                if (color && color !== "transparent") {
                    svgContent += `<rect x="${x}" y="${y}" width="1" height="1" fill="${color}" />`;
                }
            });
        });

        if (layer.opacity < 100) {
            svgContent += `</g>`;
        }
    });
    
    svgContent += `</svg>`;
    
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.download = `${project.name || "untitled"}.svg`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
