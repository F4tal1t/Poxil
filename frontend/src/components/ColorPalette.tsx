import { useState } from "react";
import { useEditorStore } from "../lib/store";

interface ColorPaletteProps {
  className?: string;
}

const COLOR_PRESETS = [
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF",
  "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080",
  "#FFC0CB", "#A52A2A", "#808080", "#C0C0C0", "#FFD700",
  "#4B0082", "#FF6347", "#40E0D0", "#EE82EE", "#F5DEB3",
];

export default function ColorPalette({ className = "" }: ColorPaletteProps) {
  const { primaryColor, secondaryColor, setPrimaryColor, setSecondaryColor } = useEditorStore();
  const [showCustomColor, setShowCustomColor] = useState(false);

  const handleColorSelect = (color: string, isPrimary: boolean) => {
    if (isPrimary) {
      setPrimaryColor(color);
    } else {
      setSecondaryColor(color);
    }
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>, isPrimary: boolean) => {
    const color = e.target.value;
    if (isPrimary) {
      setPrimaryColor(color);
    } else {
      setSecondaryColor(color);
    }
  };

  const swapColors = () => {
    const temp = primaryColor;
    setPrimaryColor(secondaryColor);
    setSecondaryColor(temp);
  };

  return (
    <div className={`bg-gray-800 border-l border-gray-700 p-4 flex flex-col ${className}`}>
      <h3 className="text-sm font-semibold mb-4 text-gray-300">Colors</h3>
      
      {/* Primary and Secondary Color Display */}
      <div className="mb-6">
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <div 
              className="w-16 h-16 rounded-lg border-2 border-gray-600 cursor-pointer transition-transform hover:scale-105"
              style={{ backgroundColor: secondaryColor }}
              onClick={() => setShowCustomColor(!showCustomColor)}
              title="Secondary color (Right click)"
            />
            <div 
              className="w-16 h-16 rounded-lg border-2 border-gray-600 cursor-pointer transition-transform hover:scale-105 absolute -top-2 -left-2"
              style={{ backgroundColor: primaryColor }}
              onClick={() => setShowCustomColor(!showCustomColor)}
              title="Primary color (Left click)"
            />
          </div>
        </div>
        
        <button 
          onClick={swapColors}
          className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors mb-3"
        >
          Swap Colors
        </button>
      </div>

      {/* Custom Color Pickers */}
      {showCustomColor && (
        <div className="mb-4 p-3 bg-gray-700 rounded-lg">
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Primary</label>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => handleCustomColorChange(e, true)}
                className="w-full h-8 rounded cursor-pointer bg-gray-600"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Secondary</label>
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => handleCustomColorChange(e, false)}
                className="w-full h-8 rounded cursor-pointer bg-gray-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* Color Palette */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-gray-400">Palette</h4>
          <button 
            onClick={() => setShowCustomColor(!showCustomColor)}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            {showCustomColor ? "Hide" : "Custom"}
          </button>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {COLOR_PRESETS.map((color) => (
            <button
              key={color}
              onClick={() => handleColorSelect(color, true)}
              onContextMenu={(e) => {
                e.preventDefault();
                handleColorSelect(color, false);
              }}
              className={`w-8 h-8 rounded border-2 transition-all duration-150 hover:scale-110 ${
                primaryColor === color ? 'border-white scale-110' : 
                secondaryColor === color ? 'border-gray-400' : 
                'border-gray-600'
              }`}
              style={{ backgroundColor: color }}
              title={`${color} (Left click for primary, Right click for secondary)`}
            />
          ))}
        </div>
      </div>

      {/* Recently Used Colors */}
      <div className="mt-auto pt-4 border-t border-gray-700">
        <h4 className="text-xs font-semibold mb-2 text-gray-400">Recent</h4>
        <div className="flex gap-2 flex-wrap">
          {[primaryColor, secondaryColor, "#FF0000", "#00FF00", "#0000FF"].slice(0, 8).map((color, index) => (
            <button
              key={`${color}-${index}`}
              onClick={() => handleColorSelect(color, true)}
              onContextMenu={(e) => {
                e.preventDefault();
                handleColorSelect(color, false);
              }}
              className="w-6 h-6 rounded border border-gray-600 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="text-xs text-gray-500 space-y-1">
          <div>🖱️ Left click: Primary</div>
          <div>🖱️ Right click: Secondary</div>
        </div>
      </div>
    </div>
  );
}