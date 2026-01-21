import { useState, useEffect } from "react";
import { useEditorStore } from "../lib/store";

interface ColorPaletteProps {
  className?: string;
}

const COLOR_PRESETS = [ 
  "#000000", "#2b2b2b", "#555555", "#808080", "#aaaaaa", "#d4d4d4", "#ffffff",  
  "#2b0000", "#550000", "#800000", "#aa0000", "#d40000", "#ff0000", "#ff5555",
  "#2b1400", "#552b00", "#804000", "#aa5500", "#d46a00", "#ff8000", "#ffaa55",
  "#1a0d00", "#331a00", "#4d2600", "#663300", "#804000", "#994d00", "#b35900",
  "#2b2b00", "#555500", "#808000", "#aaaa00", "#d4d400", "#ffff00", "#ffff55",
  "#142b00", "#2b5500", "#408000", "#55aa00", "#6ad400", "#80ff00", "#aaff55",
  "#002b00", "#005500", "#008000", "#00aa00", "#00d400", "#00ff00", "#55ff55",
  "#002b14", "#00552b", "#008040", "#00aa55", "#00d46a", "#00ff80", "#55ffaa",
  "#002b2b", "#005555", "#008080", "#00aaaa", "#00d4d4", "#00ffff", "#55ffff",
  "#00142b", "#002b55", "#004080", "#0055aa", "#006ad4", "#0080ff", "#55aaff",
  "#00002b", "#000055", "#000080", "#0000aa", "#0000d4", "#0000ff", "#5555ff",
  "#14002b", "#2b0055", "#400080", "#5500aa", "#6a00d4", "#8000ff", "#aa55ff",
  "#2b002b", "#550055", "#800080", "#aa00aa", "#d400d4", "#ff00ff", "#ff55ff",
  "#2b0014", "#55002b", "#800040", "#aa0055", "#d4006a", "#ff0080", "#ff55aa",
  "#2b000d", "#55001a", "#800026", "#aa0033", "#d40040", "#ff004d", "#ff5588",
];

export default function ColorPalette({ className = "" }: ColorPaletteProps) {
  const { primaryColor, secondaryColor, setPrimaryColor, setSecondaryColor } = useEditorStore();
  const [showCustomColor, setShowCustomColor] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>([]);

  const handleColorSelect = (color: string, isPrimary: boolean) => {
    if (isPrimary) {
      setPrimaryColor(color);
    } else {
      setSecondaryColor(color);
    }
    
    // Add to recent colors
    setRecentColors(prev => {
      const newRecent = [color, ...prev.filter(c => c !== color)].slice(0, 8);
      return newRecent;
    });
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
    <div className={`bg-[#1f1c21] border-l border-[#2a2630] flex flex-col ${className}`}>
      
      <div className="p-4 border-b border-[#2a2630]">
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <div 
              className="w-16 h-16 border-2 border-[#4a4552] cursor-pointer transition-transform hover:scale-105"
              style={{ backgroundColor: secondaryColor }}
              onClick={() => setShowCustomColor(!showCustomColor)}
              title="Secondary color (Right click)"
            />
            <div 
              className="w-16 h-16 border-2 border-[#4a4552] cursor-pointer transition-transform hover:scale-105 absolute -top-2 -left-2"
              style={{ backgroundColor: primaryColor }}
              onClick={() => setShowCustomColor(!showCustomColor)}
              title="Primary color (Left click)"
            />
          </div>
        </div>
        
        <button 
          onClick={swapColors}
          className="w-full px-3 py-2 bg-[#2a2630] hover:bg-[#35303c] text-sm transition-colors mb-2"
        >
          Swap Colors
        </button>
      </div>

      {showCustomColor && (
        <div className="p-4 bg-[#1a181c] border-b border-[#2a2630]">
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-[#ada8b7] mb-1">Primary</label>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => handleCustomColorChange(e, true)}
                className="w-full h-8 cursor-pointer bg-[#35303c] border-none"
              />
            </div>
            <div>
              <label className="block text-xs text-[#ada8b7] mb-1">Secondary</label>
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => handleCustomColorChange(e, false)}
                className="w-full h-8 cursor-pointer bg-[#35303c] border-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Color Palette */}
      <div className="p-4 bg-[#1f1c21]">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-[#8c8796] uppercase tracking-wide">Palette</h4>
        </div>
        <div className="max-h-60 overflow-y-auto pr-1">
          <div className="grid grid-cols-7 gap-0 border border-[#2a2630]">
            {COLOR_PRESETS.map((color, idx) => (
              <button
                key={`${color}-${idx}`}
                onClick={() => handleColorSelect(color, true)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleColorSelect(color, false);
                }}
                className={`w-full aspect-square border transition-all duration-150 ${
                  primaryColor === color ? 'border-white z-20 scale-110 shadow-lg' : 
                  secondaryColor === color ? 'border-[#ada8b7] z-20' : 
                  'border-[#2a2630] hover:border-gray-500 hover:z-10'
                }`}
                style={{ backgroundColor: color }}
                title={`${color} (Left click for primary, Right click for secondary)`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Recently Used Colors */}
      <div className="mt-auto p-4 pt-0 border-t border-[#2a2630]">
        <h4 className="text-xs font-semibold mb-2 mt-4 text-[#8c8796] uppercase tracking-wide">Recent</h4>
        <div className="grid grid-cols-5 gap-1 min-h-[24px]">
          {recentColors.length > 0 ? (
            recentColors.map((color, index) => (
              <button
                key={`${color}-${index}`}
                onClick={() => handleColorSelect(color, true)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleColorSelect(color, false);
                }}
                className="w-full aspect-square border border-[#35303c] hover:border-gray-500 transition-all"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))
          ) : (
            <div className="col-span-5 text-xs text-[#5f5a6b] italic text-center py-2">No recent colors</div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-[#2a2630] bg-[#1a181c]">
        <div className="text-[10px] text-[#5f5a6b] space-y-1 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8c8796]"></span>
            L-Click: Primary Color
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full border border-[#8c8796]"></span>
            R-Click: Secondary Color
          </div>
        </div>
      </div>
    </div>
  );
}