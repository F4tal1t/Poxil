import { useRef, useEffect, useState, useCallback } from "react";
import { useEditorStore } from "../lib/store";

// Helper functions for geometric shapes
function getLinePoints(x0: number, y0: number, x1: number, y1: number) {
  const points: {x: number, y: number}[] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = (x0 < x1) ? 1 : -1;
  const sy = (y0 < y1) ? 1 : -1;
  let err = dx - dy;

  while(true) {
    points.push({x: x0, y: y0});
    if ((x0 === x1) && (y0 === y1)) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
  return points;
}

function getRectanglePoints(x0: number, y0: number, x1: number, y1: number) {
  const points: {x: number, y: number}[] = [];
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);
  
  for (let x = minX; x <= maxX; x++) {
    points.push({x, y: minY});
    points.push({x, y: maxY});
  }
  for (let y = minY; y <= maxY; y++) {
    points.push({x: minX, y});
    points.push({x: maxX, y});
  }
  return points;
}

function getCirclePoints(x0: number, y0: number, x1: number, y1: number) {
  const points: {x: number, y: number}[] = [];
  const r = Math.floor(Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2)));
  let x = 0;
  let y = r;
  let d = 3 - 2 * r;

  const addSymmetry = (cx: number, cy: number, x: number, y: number) => {
    points.push({x: cx + x, y: cy + y});
    points.push({x: cx - x, y: cy + y});
    points.push({x: cx + x, y: cy - y});
    points.push({x: cx - x, y: cy - y});
    points.push({x: cx + y, y: cy + x});
    points.push({x: cx - y, y: cy + x});
    points.push({x: cx + y, y: cy - x});
    points.push({x: cx - y, y: cy - x});
  };

  while (y >= x) {
    addSymmetry(x0, y0, x, y);
    x++;
    if (d > 0) {
      y--;
      d = d + 4 * (x - y) + 10;
    } else {
      d = d + 4 * x + 6;
    }
  }
  return points;
}

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
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{x: number, y: number} | null>(null);
  const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null);
  const [cursorPixel, setCursorPixel] = useState<{x: number, y: number} | null>(null);
  
  const { 
    currentFrame,
    activeLayerId,
    selectedTool, 
    primaryColor, 
    secondaryColor, 
    currentProject,
    updatePixel,
    setCurrentProject,
    mirrorX,
    mirrorY
  } = useEditorStore();

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background (checkers)
    const checkSize = pixelSize; // Or smaller
    // Fill white
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw grid lines or checkers if needed, but for now transparent is transparent
    
    // Draw pixels if project exists
    if (currentProject) {
      const frame = currentProject.frames[currentFrame];
      const layers = currentProject.layers || [];
      
      // Render from Bottom to Top
      [...layers].reverse().forEach(layer => {
        if (!layer.visible) return;
        const grid = frame?.layers[layer.id];
        if (!grid) return;
        
        ctx.globalAlpha = layer.opacity / 100;
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const color = grid[y]?.[x] || "transparent";
            if (color !== "transparent") {
              ctx.fillStyle = color;
              ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
            }
          }
        }
        ctx.globalAlpha = 1.0;
      });
    }

    // Draw grid
    ctx.strokeStyle = "rgba(0,0,0, 0.1)"; 
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

    // Draw shape preview
    if (isDrawing && startPos && cursorPixel) {
      const toolType = selectedTool.type;
      if (["line", "rectangle", "circle"].includes(toolType)) {
        let points: {x: number, y: number}[] = [];
        
        if (toolType === "line") {
          points = getLinePoints(startPos.x, startPos.y, cursorPixel.x, cursorPixel.y);
        } else if (toolType === "rectangle") {
          points = getRectanglePoints(startPos.x, startPos.y, cursorPixel.x, cursorPixel.y);
        } else if (toolType === "circle") {
          points = getCirclePoints(startPos.x, startPos.y, cursorPixel.x, cursorPixel.y);
        }

        ctx.fillStyle = primaryColor; // Use primary color for preview
        points.forEach(p => {
            if (p.x >= 0 && p.x < width && p.y >= 0 && p.y < height) {
                ctx.fillRect(p.x * pixelSize, p.y * pixelSize, pixelSize, pixelSize);
            }
        });
      }
    }
  }, [width, height, pixelSize, currentProject, currentFrame, isDrawing, startPos, cursorPixel, selectedTool, primaryColor]);

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
    if (currentProject) {
      // NOTE: Ideally we would have a batch update in the store to avoid multiple re-renders
      points.forEach(({ x, y, color }) => {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          updatePixel(currentFrame, x, y, color);
        }
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
    setStartPos(coords); // Track start position for shapes
    
    const color = e.button === 2 ? secondaryColor : primaryColor;
    
    switch (selectedTool.type) {
      case "pencil":
        drawWithBrush(coords.x, coords.y, color);
        break;
      case "eraser":
        drawWithBrush(coords.x, coords.y, "transparent");
        break;
      case "picker":
        if (currentProject && activeLayerId) {
          const frame = currentProject.frames[currentFrame];
          const layerGrid = frame?.layers[activeLayerId];
          const pickedColor = layerGrid?.[coords.y]?.[coords.x];
          
          if (pickedColor && pickedColor !== "transparent") {
            // Update primary color in store
            useEditorStore.getState().setPrimaryColor(pickedColor);
          }
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
    setStartPos(null);
    setIsDrawing(false);
    if (onPixelHover) onPixelHover(null);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDrawing && startPos && cursorPixel) {
      const toolType = selectedTool.type;
      if (["line", "rectangle", "circle"].includes(toolType)) {
        let points: {x: number, y: number}[] = [];
        if (toolType === "line") {
          points = getLinePoints(startPos.x, startPos.y, cursorPixel.x, cursorPixel.y);
        } else if (toolType === "rectangle") {
          points = getRectanglePoints(startPos.x, startPos.y, cursorPixel.x, cursorPixel.y);
        } else if (toolType === "circle") {
          points = getCirclePoints(startPos.x, startPos.y, cursorPixel.x, cursorPixel.y);
        }

        const color = e.button === 2 ? secondaryColor : primaryColor;
        const pointsToDraw = points.map(p => ({ x: p.x, y: p.y, color }));
        drawPixels(pointsToDraw);
      }
    }
    setIsDrawing(false);
    setStartPos(null);
  };

  // Flood fill algorithm
  const floodFill = useCallback((startX: number, startY: number, fillColor: string) => {
    if (!currentProject || !activeLayerId) return;
    
    const frame = currentProject.frames[currentFrame];
    const layerGrid = frame?.layers[activeLayerId];
    if (!layerGrid) return;

    const targetColor = layerGrid[startY]?.[startX] || "transparent";
    
    if (targetColor === fillColor) return;
    
    const newLayerGrid = layerGrid.map(row => [...row]);
    const stack = [[startX, startY]];
    const visited = new Set<string>();
    
    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const key = `${x},${y}`;
      
      if (visited.has(key) || x < 0 || x >= width || y < 0 || y >= height) continue;
      
      const currentColor = newLayerGrid[y]?.[x] || "transparent";
      if (currentColor !== targetColor) continue;
      
      visited.add(key);
      newLayerGrid[y][x] = fillColor;
      
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    
    // Update the active layer for the frame
    const newFrames = [...currentProject.frames];
    newFrames[currentFrame] = {
      ...newFrames[currentFrame],
      layers: {
        ...newFrames[currentFrame].layers,
        [activeLayerId]: newLayerGrid
      }
    };
    
    setCurrentProject({
      ...currentProject,
      frames: newFrames
    });
  }, [currentProject, currentFrame, activeLayerId, width, height, setCurrentProject]);

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