import { useRef, useEffect, useState, useCallback } from "react";
import { useEditorStore } from "../lib/store";

interface InteractiveCanvasProps {
  width: number;
  height: number;
  pixelSize: number;
  zoom: number;
  pan: { x: number; y: number };
  className?: string;
}

export default function InteractiveCanvas({ 
  width, 
  height, 
  pixelSize, 
  zoom, 
  pan, 
  className = ""
}: InteractiveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pixels, setPixels] = useState<string[][]>(
    Array(height).fill(null).map(() => Array(width).fill("transparent"))
  );
  const [isDrawing, setIsDrawing] = useState(false);
  
  const { 
    currentFrame, 
    selectedTool, 
    primaryColor, 
    secondaryColor, 
    currentProject,
    updatePixel,
    setCurrentProject 
  } = useEditorStore();

  // Initialize pixels from current project/frame
  useEffect(() => {
    if (currentProject?.frames[currentFrame]?.pixels) {
      setPixels(currentProject.frames[currentFrame].pixels);
    } else {
      // Initialize with transparent pixels or a default pattern
      const initialPixels = Array(height).fill(null).map(() => Array(width).fill("transparent"));
      setPixels(initialPixels);
    }
  }, [currentProject, currentFrame, width, height]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentProject) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw pixels
    const currentPixels = currentProject.frames[currentFrame]?.pixels || [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const color = currentPixels[y]?.[x] || "#ffffff";
        if (color !== "transparent") {
          ctx.fillStyle = color;
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
      }
    }

    // Draw grid
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * pixelSize, 0);
      ctx.lineTo(x * pixelSize, height * pixelSize);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * pixelSize);
      ctx.lineTo(width * pixelSize, y * pixelSize);
      ctx.stroke();
    }
  }, [width, height, pixelSize, currentProject, currentFrame]);

  useEffect(() => {
    // drawCanvas(); // function does not exist, rendering is handled by the effect above
  }, []);

  // Get pixel coordinates from mouse position
  const getPixelCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / pixelSize);
    const y = Math.floor((e.clientY - rect.top) / pixelSize);

    if (x >= 0 && x < width && y >= 0 && y < height) {
      return { x, y };
    }
    return null;
  };

  // Draw pixel
  const drawPixel = useCallback((x: number, y: number, color: string) => {
    const newPixels = pixels.map(row => [...row]);
    newPixels[y][x] = color;
    setPixels(newPixels);
    
    // Update in store
    if (currentProject) {
      updatePixel(currentFrame, x, y, color);
    }
  }, [pixels, currentProject, currentFrame, updatePixel]);

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getPixelCoords(e);
    if (!coords) return;

    setIsDrawing(true);
    
    const color = e.button === 2 ? secondaryColor : primaryColor;
    
    switch (selectedTool.type) {
      case "pencil":
        drawPixel(coords.x, coords.y, color);
        break;
      case "eraser":
        drawPixel(coords.x, coords.y, "transparent");
        break;
      case "picker":
        const pickedColor = pixels[coords.y][coords.x];
        if (pickedColor !== "transparent") {
          // You might want to update primary color here
          // useEditorStore.getState().setPrimaryColor(pickedColor);
        }
        break;
      case "fill":
        // Flood fill implementation would go here
        floodFill(coords.x, coords.y, color);
        break;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const coords = getPixelCoords(e);
    if (!coords) return;

    const color = e.buttons === 2 ? secondaryColor : primaryColor;
    
    switch (selectedTool.type) {
      case "pencil":
      case "eraser":
        drawPixel(coords.x, coords.y, selectedTool.type === "eraser" ? "transparent" : color);
        break;
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // Flood fill algorithm
  const floodFill = useCallback((startX: number, startY: number, fillColor: string) => {
    if (!currentProject) return;
    
    const currentPixels = currentProject.frames[currentFrame]?.pixels || [];
    const targetColor = currentPixels[startY]?.[startX] || "transparent";
    
    if (targetColor === fillColor) return;
    
    const newPixels = currentPixels.map(row => [...row]);
    const stack = [[startX, startY]];
    const visited = new Set<string>();
    
    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const key = `${x},${y}`;
      
      if (visited.has(key) || x < 0 || x >= width || y < 0 || y >= height) continue;
      if ((currentPixels[y]?.[x] || "transparent") !== targetColor) continue;
      
      visited.add(key);
      newPixels[y][x] = fillColor;
      
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    
    // Update the entire frame
    const newFrames = [...currentProject.frames];
    newFrames[currentFrame] = {
      ...newFrames[currentFrame],
      pixels: newPixels
    };
    
    setCurrentProject({
      ...currentProject,
      frames: newFrames
    });
  }, [currentProject, currentFrame, width, height, setCurrentProject]);

  // Prevent context menu on right click
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div 
      style={{ 
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        transformOrigin: "center",
        transition: "transform 0.05s ease-out"
      }}
      className={className}
    >
      <canvas
        ref={canvasRef}
        width={width * pixelSize}
        height={height * pixelSize}
        className="canvas-grid border-2 border-gray-600 shadow-lg cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
      />
    </div>
  );
}