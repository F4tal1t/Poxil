import { useRef, useEffect, useState, useCallback } from "react";
import { useEditorStore } from "../lib/store";

interface InteractiveCanvasProps {
  width: number;
  height: number;
  pixelSize: number;
  zoom: number;
  pan: { x: number; y: number };
  className?: string;
  onPixelHover?: (pos: { x: number; y: number } | null) => void;
}

export default function InteractiveCanvas({ 
  width, 
  height, 
  pixelSize, 
  zoom, 
  pan, 
  className = "",
  onPixelHover
}: InteractiveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pixels, setPixels] = useState<string[][]>(
    Array(height).fill(null).map(() => Array(width).fill("transparent"))
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null);
  const [cursorPixel, setCursorPixel] = useState<{x: number, y: number} | null>(null);
  
  const { 
    currentFrame, 
    selectedTool, 
    primaryColor, 
    secondaryColor, 
    currentProject,
    updatePixel,
    setCurrentProject,
    mirrorX,
    mirrorY
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
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas with subtle background
    ctx.fillStyle = "#f8fafc"; // Very light gray background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw pixels if project exists
    if (currentProject) {
      const currentPixels = currentProject.frames[currentFrame]?.pixels || [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const color = currentPixels[y]?.[x] || "transparent";
          if (color !== "transparent") {
            ctx.fillStyle = color;
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
          }
        }
      }
    }

    // Draw grid with more visible lines
    ctx.strokeStyle = "rgba(209, 213, 219, 0.6)"; // More visible grid
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

  // Get pixel coordinates from mouse position, accounting for zoom and pan
  const getPixelCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    // Mouse position relative to the canvas element (already transformed)
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Convert to logical canvas coordinates (undo the zoom)
    const logicalX = mouseX / zoom;
    const logicalY = mouseY / zoom;
    
    // Convert to pixel coordinates
    const x = Math.floor(logicalX / pixelSize);
    const y = Math.floor(logicalY / pixelSize);

    if (x >= 0 && x < width && y >= 0 && y < height) {
      return { x, y };
    }
    return null;
  };

  // Batch draw pixels
  const drawPixels = useCallback((points: { x: number; y: number; color: string }[]) => {
    setPixels(prev => {
      const newPixels = prev.map(row => [...row]);
      points.forEach(({ x, y, color }) => {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          newPixels[y][x] = color;
        }
      });
      return newPixels;
    });

    if (currentProject) {
      points.forEach(({ x, y, color }) => {
        updatePixel(currentFrame, x, y, color);
      });
    }
  }, [width, height, currentProject, currentFrame, updatePixel]);

  // Draw with brush size (square brush) and mirror support
  const drawWithBrush = useCallback((centerX: number, centerY: number, color: string) => {
    const brushSize = selectedTool.size || 1;
    const halfSize = Math.floor(brushSize / 2);
    const pointsToDraw: { x: number; y: number; color: string }[] = [];

    const addPoint = (x: number, y: number) => {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        pointsToDraw.push({ x, y, color });
      }
    };

    // Calculate points for the primary brush stroke
    for (let dy = -halfSize; dy <= halfSize; dy++) {
      for (let dx = -halfSize; dx <= halfSize; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        
        addPoint(x, y);

        // Mirror X
        if (mirrorX) {
          addPoint(width - 1 - x, y);
        }

        // Mirror Y
        if (mirrorY) {
          addPoint(x, height - 1 - y);
        }

        // Mirror Both
        if (mirrorX && mirrorY) {
          addPoint(width - 1 - x, height - 1 - y);
        }
      }
    }
    
    drawPixels(pointsToDraw);
  }, [selectedTool.size, width, height, mirrorX, mirrorY, drawPixels]);

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getPixelCoords(e);
    if (!coords) return;

    setIsDrawing(true);
    setCursorPixel(coords);
    
    const color = e.button === 2 ? secondaryColor : primaryColor;
    
    switch (selectedTool.type) {
      case "pencil":
        drawWithBrush(coords.x, coords.y, color);
        break;
      case "eraser":
        drawWithBrush(coords.x, coords.y, "transparent");
        break;
      case "picker":
        const pickedColor = pixels[coords.y][coords.x];
        if (pickedColor !== "transparent") {
          // Update primary color in store
          useEditorStore.getState().setPrimaryColor(pickedColor);
        }
        break;
      case "fill":
        // Flood fill implementation would go here
        floodFill(coords.x, coords.y, color);
        break;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }

    const coords = getPixelCoords(e);
    setCursorPixel(coords);
    if (onPixelHover) onPixelHover(coords);

    if (!isDrawing) return;
    
    if (!coords) return;

    const color = e.buttons === 2 ? secondaryColor : primaryColor;
    
    switch (selectedTool.type) {
      case "pencil":
      case "eraser":
        drawWithBrush(coords.x, coords.y, selectedTool.type === "eraser" ? "transparent" : color);
        break;
    }
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    setCursorPixel(null);
    setIsDrawing(false);
    if (onPixelHover) onPixelHover(null);
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
      className={`relative ${className}`}
    >
      <canvas
        ref={canvasRef}
        width={width * pixelSize}
        height={height * pixelSize}
        className="border-2 border-gray-600 shadow-lg cursor-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
      />
      
      {/* Custom aim cursor - positioned at pixel center */}
      {cursorPixel && (
        <div
          className="absolute pointer-events-none z-10"
          style={{
            left: cursorPixel.x * pixelSize + pixelSize / 2 - 8,
            top: cursorPixel.y * pixelSize + pixelSize / 2 - 8,
            width: 16,
            height: 16,
          }}
        >
          <div className="w-full h-full border-2 border-blue-500 rounded-full bg-blue-500/20"></div>
          <div className="absolute top-1/2 left-1/2 w-0.5 h-0.5 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      )}
    </div>
  );
}