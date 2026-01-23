import { Project } from "../types";
// @ts-ignore
import { GIFEncoder, quantize, applyPalette } from "gifenc";

// Helper to render a specific frame to a data URL
const renderFrameToDataUrl = (project: Project, frameIndex: number, scale: number, backgroundColor: string | null = null): string | null => {
  const canvas = document.createElement("canvas");
  canvas.width = project.width * scale;
  canvas.height = project.height * scale;
  const ctx = canvas.getContext("2d");
  
  if (!ctx) return null;

  ctx.imageSmoothingEnabled = false;

  const frame = project.frames[frameIndex];
  const layers = project.layers || [];

  // Background
  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

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
    
    // Create encoder
    const gif = new GIFEncoder();
    const width = project.width * scale;
    const height = project.height * scale;
    
    project.frames.forEach((_, index) => {
        // Render frame to canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        
        ctx.imageSmoothingEnabled = false;
        
        // Clear canvas (transparent)
        ctx.clearRect(0, 0, width, height);
        
        const frame = project.frames[index];
        const layers = project.layers || [];
        
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
        
        // Get raw data
        const { data } = ctx.getImageData(0, 0, width, height);
        
        // Quantize colors and create palette
        // Use rgba4444 to preserve alpha channel for transparency
        const palette = quantize(data, 256, { format: 'rgba4444' });
        const indexData = applyPalette(data, palette, 'rgba4444');
        
        // Write frame
        gif.writeFrame(indexData, width, height, { 
            palette, 
            delay: 1000 / fps, 
            transparent: true, 
            dispose: 2 
        });
    });

    gif.finish();
    
    // Download
    const buffer = gif.bytes(); 
    const blob = new Blob([buffer], { type: 'image/gif' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.download = `${project.name || "animation"}.gif`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
