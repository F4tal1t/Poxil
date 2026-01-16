import { useState } from "react";

interface CanvasSizeDialogProps {
  onConfirm: (width: number, height: number) => void;
}

export default function CanvasSizeDialog({ onConfirm }: CanvasSizeDialogProps) {
  const [width, setWidth] = useState(32);
  const [height, setHeight] = useState(32);

  const presets = [
    { name: "16x16", w: 16, h: 16 },
    { name: "32x32", w: 32, h: 32 },
    { name: "64x64", w: 64, h: 64 },
    { name: "128x128", w: 128, h: 128 },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Create New Canvas</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">Width</label>
              <input
                type="number"
                min="8"
                max="256"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 rounded"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Height</label>
              <input
                type="number"
                min="8"
                max="256"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">Presets</label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setWidth(preset.w);
                    setHeight(preset.h);
                  }}
                  className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => onConfirm(width, height)}
            className="w-full px-4 py-3 bg-blue-600 rounded hover:bg-blue-700 font-semibold"
          >
            Create Canvas
          </button>
        </div>
      </div>
    </div>
  );
}
