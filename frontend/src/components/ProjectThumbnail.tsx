import { useEffect, useRef } from "react";
import { Project } from "../types";

interface ProjectThumbnailProps {
  project: Project;
  className?: string;
}

export default function ProjectThumbnail({ project, className = "" }: ProjectThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Handle parsing if necessary (though usually axios/prisma handles json)
    let frames = project.frames;
    if (typeof frames === 'string') {
        try { frames = JSON.parse(frames); } catch(e) { return; }
    }
    
    let layersData = project.layers;
    if (typeof layersData === 'string') {
        try { layersData = JSON.parse(layersData); } catch(e) { return; }
    }
    
    if (!Array.isArray(frames) || frames.length === 0) return;
    const firstFrame = frames[0];
    if (!firstFrame || !firstFrame.layers) return;

    // Determine render order
    let sortedLayers = [];
    if (Array.isArray(layersData) && layersData.length > 0) {
        // Layers are usually stored Top -> Bottom in list, so we reverse to draw Bottom -> Top
        sortedLayers = [...layersData].reverse();
    } else {
        // Fallback
        const keys = Object.keys(firstFrame.layers);
        sortedLayers = keys.map(id => ({ id, visible: true, opacity: 100 }));
    }

    // Set canvas dimensions to match project pixels
    canvas.width = project.width;
    canvas.height = project.height;
    
    // Draw layers
    sortedLayers.forEach((layer: any) => {
        if (layer.visible === false) return;
        
        const grid = firstFrame.layers[layer.id];
        if (!grid) return;
        
        ctx.globalAlpha = (layer.opacity ?? 100) / 100;

        for (let y = 0; y < project.height; y++) {
            for (let x = 0; x < project.width; x++) {
                // grid[y][x] might be undefined if row doesn't exist or col doesn't exist
                const row = grid[y];
                const color = row ? row[x] : "transparent";
                
                if (color && color !== "transparent") {
                    ctx.fillStyle = color;
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        ctx.globalAlpha = 1.0;
    });

  }, [project]);

  return (
    <canvas 
        ref={canvasRef} 
        className={`${className}`}
        style={{ 
            imageRendering: 'pixelated', // Crucial for pixel art look
            width: '100%', 
            height: '100%',
            objectFit: 'contain'
        }}
    />
  );
}
