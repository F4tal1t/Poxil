import { useRef, useEffect, useState, useCallback } from "react";
import { useEditorStore } from "../lib/store";
import { getCharPixels } from "../lib/pixelFont";
import { socket } from "../lib/socket";

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
  const [selection, setSelection] = useState<{ start: {x: number, y: number}, end: {x: number, y: number} } | null>(null);
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
    updatePixels,
    setCurrentProject,
    mirrorX,
    mirrorY,
    tileMode,
    tileLayout,
    showOnionSkin,
    pushToHistory
  } = useEditorStore();

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const renderTile = (offsetX: number, offsetY: number) => {
        // Draw background (checkers)
        const checkSize = pixelSize;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(offsetX, offsetY, width * pixelSize, height * pixelSize);

        // Draw active pixel content
        if (currentProject) {
            // Onion Skin (Previous Frame - Active Layer)
            if (showOnionSkin && activeLayerId && currentFrame > 0) {
                const prevFrame = currentProject.frames[currentFrame - 1];
                const prevGrid = prevFrame?.layers[activeLayerId];
                if (prevGrid) {
                    ctx.globalAlpha = 0.3;
                    for (let y = 0; y < height; y++) {
                        for (let x = 0; x < width; x++) {
                            const color = prevGrid[y]?.[x];
                            if (color && color !== "transparent") {
                                ctx.fillStyle = color;
                                ctx.fillRect(offsetX + x * pixelSize, offsetY + y * pixelSize, pixelSize, pixelSize);
                            }
                        }
                    }
                    ctx.globalAlpha = 1.0;
                }
            }

            const frame = currentProject.frames[currentFrame];
            const layers = currentProject.layers || [];
            
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
                        ctx.fillRect(offsetX + x * pixelSize, offsetY + y * pixelSize, pixelSize, pixelSize);
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
            ctx.moveTo(offsetX + x * pixelSize, offsetY + 0);
            ctx.lineTo(offsetX + x * pixelSize, offsetY + height * pixelSize);
            ctx.stroke();
        }
        for (let y = 0; y <= height; y++) {
            ctx.beginPath();
            ctx.moveTo(offsetX + 0, offsetY + y * pixelSize);
            ctx.lineTo(offsetX + width * pixelSize, offsetY + y * pixelSize);
            ctx.stroke();
        }
    };

    if (tileMode) {
        ctx.save();
        ctx.scale(1, 1); // Reset any context scaling if managed externally (it's not here)
        
        // Use layout from store (default handled there or here)
        const cols = tileLayout?.x || 3;
        const rows = tileLayout?.y || 3;

        // Render from 0 to cols-1 and 0 to rows-1 (Top-Left alignment)
        for (let ix = 0; ix < cols; ix++) {
            for (let iy = 0; iy < rows; iy++) {
                 if (ix === 0 && iy === 0) {
                     // Main tile (Active) i.e. Leftmost-Topmost
                     renderTile(0, 0);
                 } else {
                     // Ghost tiles
                     ctx.globalAlpha = 0.5;
                     renderTile(ix * width * pixelSize, iy * height * pixelSize);
                     ctx.globalAlpha = 1.0;
                 }
            }
        }
        
        ctx.restore();
    } else {
        renderTile(0, 0);
    }
    
    // Onion skin logic remains separate for now, only applied to main tile usually
    
    // Draw active selection
    if (selection) {
      const minX = Math.min(selection.start.x, selection.end.x);
      const minY = Math.min(selection.start.y, selection.end.y);
      const w = Math.abs(selection.end.x - selection.start.x) + 1;
      const h = Math.abs(selection.end.y - selection.start.y) + 1;

      ctx.strokeStyle = "#fff";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1; // Thinner
      ctx.strokeRect(minX * pixelSize, minY * pixelSize, w * pixelSize, h * pixelSize);
      
      ctx.strokeStyle = "#000";
      ctx.lineDashOffset = 4;
      ctx.strokeRect(minX * pixelSize, minY * pixelSize, w * pixelSize, h * pixelSize);
      
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
      ctx.lineDashOffset = 0;
    }

    // Draw shape preview
    if (isDrawing && startPos && cursorPixel) {
      const toolType = selectedTool.type;
      
      if (toolType === "selection") {
        // Only draw new selection box if likely creating new selection (not moving)
        const inExistingSelection = selection && 
             startPos.x >= Math.min(selection.start.x, selection.end.x) && 
             startPos.x <= Math.max(selection.start.x, selection.end.x) &&
             startPos.y >= Math.min(selection.start.y, selection.end.y) &&
             startPos.y <= Math.max(selection.start.y, selection.end.y);

        if (!inExistingSelection) {
            const minX = Math.min(startPos.x, cursorPixel.x);
            const minY = Math.min(startPos.y, cursorPixel.y);
            const w = Math.abs(cursorPixel.x - startPos.x) + 1;
            const h = Math.abs(cursorPixel.y - startPos.y) + 1;

            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1;
            ctx.strokeRect(minX * pixelSize, minY * pixelSize, w * pixelSize, h * pixelSize);
            ctx.setLineDash([]);
        }
      }
      else if (["line", "rectangle", "circle"].includes(toolType)) {
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
  }, [width, height, pixelSize, currentProject, currentFrame, isDrawing, startPos, cursorPixel, selectedTool, primaryColor, selection]);

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
    let x = Math.floor(logicalX / pixelSize);
    let y = Math.floor(logicalY / pixelSize);

    // If tile mode is on, we map clicks on extended area back to original coordinates
    if (tileMode) {
        // Simple modulo for Top-Left alignment
        // x and y are positive relative to the big canvas
        x = x % width;
        y = y % height;
    }

    if (x >= 0 && x < width && y >= 0 && y < height) {
      return { x, y };
    }
    return null;
  };

  // Batch draw pixels
  const drawPixels = useCallback((points: { x: number; y: number; color: string }[]) => {
    if (currentProject) {
      if (points.length === 0) return;
      // Use batch update to prevent lag
      const validPoints = points.filter(p => p.x >= 0 && p.x < width && p.y >= 0 && p.y < height);
      updatePixels(currentFrame, validPoints);

      // Emit to socket
      if (activeLayerId && socket.connected) {
         socket.emit("pixel-update", {
             projectId: currentProject.id,
             layerId: activeLayerId,
             frameIndex: currentFrame,
             updates: validPoints
         });
      }
    }
  }, [width, height, currentProject, currentFrame, updatePixels, activeLayerId]);

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

  const drawTextOnCanvas = useCallback((text: string, x: number, y: number, color: string) => {
    const points: {x: number, y: number, color: string}[] = [];
    let cursorX = x;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const pixels = getCharPixels(char);
        
        // Always 5x5 by definition in pixelFont.ts
        const charH = pixels.length;
        const charW = pixels[0].length; 

        for (let py = 0; py < charH; py++) {
            for (let px = 0; px < charW; px++) {
                 if (pixels[py][px] === 1) {
                     points.push({ x: cursorX + px, y: y + py, color });
                 }
            }
        }
        cursorX += charW + 1; // 1px spacing
    }
    
    drawPixels(points);
  }, [drawPixels]);

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getPixelCoords(e);
    if (!coords) return;

    if (selection && selectedTool.type !== "move" && selectedTool.type !== "selection") {
      setSelection(null);
    }

    setIsDrawing(true);
    setCursorPixel(coords);
    setStartPos(coords); // Track start position for shapes
    
    const color = e.button === 2 ? secondaryColor : primaryColor;

    // Save history before modifying canvas
    if (["pencil", "eraser", "fill", "text", "line", "rectangle", "circle"].includes(selectedTool.type)) {
      pushToHistory();
    }
    
    switch (selectedTool.type) {
      case "text":
        // Slight timeout to avoid React state update clashes if any
        setTimeout(() => {
          const text = prompt("Enter text:");
          if (text) {
              drawTextOnCanvas(text, coords.x, coords.y, color);
          }
        }, 10);
        setIsDrawing(false);
        break;
      case "selection":
        setSelection(null);
        break;
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
        pushToHistory(); // Save state before fill
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
      case "selection":
         if (selection && startPos && isDrawing) {
             const dx = coords.x - startPos.x;
             const dy = coords.y - startPos.y;
             
             // Check if we started INSIDE the selection
             const minX = Math.min(selection.start.x, selection.end.x);
             const maxX = Math.max(selection.start.x, selection.end.x);
             const minY = Math.min(selection.start.y, selection.end.y);
             const maxY = Math.max(selection.start.y, selection.end.y);

             // If cursor was inside selection when drag started, we move the selection
             // Note: startPos is fixed at MouseDown. cursorPixel changes.
             // We need to know if startPos was inside selection.
             const startInSelection = startPos.x >= minX && startPos.x <= maxX && startPos.y >= minY && startPos.y <= maxY;
             
             if (startInSelection) {
                 // Move mode
                 if (dx !== 0 || dy !== 0) {
                     setSelection({
                        start: { x: selection.start.x + dx, y: selection.start.y + dy },
                        end: { x: selection.end.x + dx, y: selection.end.y + dy }
                     });
                     setStartPos(coords); // Update start to avoid exponential movement
                 }
             } else {
                 // New selection mode handled in Draw Shape Preview usually?
                 // Actually selection is drawn in real time in the effect
             }
         }
         break;
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

      if (toolType === "selection") {
         // Check if we were moving
         if (selection) {
             const minX = Math.min(selection.start.x, selection.end.x);
             const maxX = Math.max(selection.start.x, selection.end.x);
             const minY = Math.min(selection.start.y, selection.end.y);
             const maxY = Math.max(selection.start.y, selection.end.y);
             const startInSelection = startPos.x >= minX && startPos.x <= maxX && startPos.y >= minY && startPos.y <= maxY;
             
             if (!startInSelection) {
                 // Created new selection
                 setSelection({ start: startPos, end: cursorPixel });
             }
         } else {
             // Created first selection
             setSelection({ start: startPos, end: cursorPixel });
         }
      }

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
        width={tileMode ? width * pixelSize * (tileLayout?.x || 3) : width * pixelSize}
        height={tileMode ? height * pixelSize * (tileLayout?.y || 3) : height * pixelSize}
        className="border-2 border-gray-600 shadow-lg cursor-none bg-[#333]"
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

      {/* Selection Move Handle - Top Right of Selection Box */}
      {selection && (
          <div
             className="absolute z-20 cursor-move"
             style={{
                 left: (Math.max(selection.start.x, selection.end.x) + 1) * pixelSize,
                 top: (Math.min(selection.start.y, selection.end.y)) * pixelSize - 12,
             }}
             onMouseDown={(e) => {
                 e.stopPropagation(); 
                 e.preventDefault();
                 // Hacky way to trigger move mode: simulated mousedown on the selection center
                 const centerX = (selection.start.x + selection.end.x) / 2;
                 const centerY = (selection.start.y + selection.end.y) / 2;
                 
                 // We manually set state to start dragging the selection
                 // But simply starting drag moves the selection frame, not pixels yet without complex logic
                 // For now, this handle acts as a visual grip that allows dragging the frame effectively
                 // by leveraging the existing "startInSelection" logic if we fake it?
                 // No, better to just let user drag inside the box.
                 
                 // However, user requested a button. Let's make this button trigger a "Cut & Move" action?
                 // Or just be a grip. 
                 
                 // Since the user asked for a "button to move around", let's make dragging THIS button move the selection.
                 // We need to inject into the existing mouse flow.
                 const rect = canvasRef.current?.getBoundingClientRect();
                 if(rect) {
                     // We can't easily inject into React state from here without duplicating logic.
                     // Instead, let's just make this button purely visual for now or bind it to a specific action
                     // For "moving the selected part", usually dragging INSIDE the selection is enough.
                     // I will attach the handleMouseDown of the canvas to this div, so dragging it acts like dragging the canvas
                     // but we need to ensure coordinate math works.
                     
                     // Actually, if we just pass the event, the target is the div, not canvas.
                     // Let's manually trigger the state change
                     setIsDrawing(true);
                     setStartPos({ x: Math.round(centerX), y: Math.round(centerY) }); 
                     // This sets start pos to center of selection, so it THINKS we clicked inside.
                 }
            }}
          >
              <div className="bg-blue-600 text-white p-1 rounded-full shadow-md hover:bg-blue-700 transition-colors pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="5 9 2 12 5 15"></polyline>
                      <polyline points="9 5 12 2 15 5"></polyline>
                      <polyline points="15 19 12 22 9 19"></polyline>
                      <polyline points="19 9 22 12 19 15"></polyline>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <line x1="12" y1="2" x2="12" y2="22"></line>
                  </svg>
              </div>
          </div>
      )}
    </div>
  );
}