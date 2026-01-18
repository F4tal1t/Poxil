import { useRef, useEffect } from "react";

interface PixelCanvasProps {
  width: number;
  height: number;
  pixelSize: number;
  zoom: number;
  pan: { x: number; y: number };
}

export default function PixelCanvas({ width, height, pixelSize, zoom, pan }: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if ((x + y) % 2 === 0) {
          ctx.fillStyle = "#e5e7eb";
        } else {
          ctx.fillStyle = "#eaeaeb";
        }
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      }
    }

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
  }, [width, height, pixelSize]);

  return (
    <div 
      style={{ 
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        transformOrigin: "center",
        transition: "transform 0.05s ease-out"
      }}
    >
      <canvas
        ref={canvasRef}
        width={width * pixelSize}
        height={height * pixelSize}
        className="canvas-grid border-2 border-gray-600 shadow-lg"
      />
    </div>
  );
}