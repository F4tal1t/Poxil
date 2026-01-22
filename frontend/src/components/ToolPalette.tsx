import { useState, useEffect } from "react";
import { Pencil, Plus, Minus } from "akar-icons";
import { useEditorStore } from "../lib/store";

// Custom SVG icons for tools
const EraserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
    <path d="M20 20L4 4L7 1L23 17L20 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 23L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ColorPickerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
    <path d="M12 2L14 4L4 14L2 12L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 10L22 12L12 22L10 20L20 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
  </svg>
);

const FillBucketIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
    <path d="M3 14L3 21L10 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.5 7.5L16.5 3.5C16.1 3.1 15.6 3 15.2 3.3L8.3 10.2C8.1 10.4 8 10.6 8 10.9V13C8 13.6 8.4 14 9 14H11.1C11.4 14 11.6 13.9 11.8 13.7L18.7 6.8C19 6.4 19 5.9 18.6 5.5L18.5 5.4C18.1 5 17.6 5 17.2 5.4L10.3 12.3C10.1 12.5 9.9 12.6 9.6 12.6H7.5C6.7 12.6 6 11.9 6 11.1V9C6 8.7 6.1 8.5 6.3 8.3L13.2 1.4C13.6 1 13.6 0.5 13.2 0.1L13.1 0C12.7 -0.2 12.2 -0.2 11.8 0.2L4.9 7.1C4.7 7.3 4.6 7.5 4.6 7.8V9.9C4.6 10.7 5.3 11.4 6.1 11.4H8.2C8.5 11.4 8.7 11.3 8.9 11.1L15.8 4.2C16.2 3.8 16.7 3.8 17.1 4.2L21.1 8.2C21.5 8.6 21.5 9.1 21.1 9.5L14.2 16.4C14 16.6 13.8 16.7 13.5 16.7H11.4C10.6 16.7 9.9 16 9.9 15.2V13.1C9.9 12.8 10 12.6 10.2 12.4L17.1 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LineIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
    <path d="M4 20L20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RectangleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MoveIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
    <path d="M5 9L2 12L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 5L12 2L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 9L22 12L19 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 19L12 22L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SelectionIcon = () => (
   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
     <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 4"/>
  </svg>
);

const TextIcon = () => (
   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
    <path d="M4 7V4H20V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 20H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface ToolPaletteProps {
  className?: string;
  compact?: boolean;
}

const tools = [
  { id: "pencil", name: "Pencil", icon: Pencil, shortcut: "P", description: "Draw pixels with the selected color" },
  { id: "eraser", name: "Eraser", icon: EraserIcon, shortcut: "E", description: "Remove pixels (make transparent)" },
  { id: "fill", name: "Fill", icon: FillBucketIcon, shortcut: "F", description: "Fill an area with the selected color" },
  { id: "picker", name: "Picker", icon: ColorPickerIcon, shortcut: "I", description: "Pick a color from the canvas" },
  { id: "line", name: "Line", icon: LineIcon, shortcut: "L", description: "Draw straight lines" },
  { id: "rectangle", name: "Rectangle", icon: RectangleIcon, shortcut: "R", description: "Draw rectangles" },
  { id: "circle", name: "Circle", icon: CircleIcon, shortcut: "C", description: "Draw circles" },
  { id: "selection", name: "Selection", icon: SelectionIcon, shortcut: "S", description: "Select an area" },
  { id: "text", name: "Text", icon: TextIcon, shortcut: "T", description: "Add text" },
];

export default function ToolPalette({ className = "", compact = false }: ToolPaletteProps) {
  const { 
    selectedTool, 
    setSelectedTool
  } = useEditorStore();
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  // Fix brush size sync with store
  useEffect(() => {
    // Ensure the store's selectedTool has the correct size when component mounts
    if (selectedTool.size === undefined) {
      setSelectedTool({ ...selectedTool, size: 1 });
    }
  }, []);

  const handleToolSelect = (toolId: string) => {
    setSelectedTool({ 
      type: toolId as any, 
      size: selectedTool.size || 1 
    });
  };

  if (compact) {
    return (
      <div className={`bg-[#1f1c21] border-r border-[#2a2630] p-2 flex flex-col ${className}`}>
        <div className="space-y-1">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = selectedTool.type === tool.id;
            const isHovered = hoveredTool === tool.id;
            
            return (
              <div key={tool.id} className="relative">
                <button
                  onClick={() => handleToolSelect(tool.id)}
                  onMouseEnter={() => setHoveredTool(tool.id)}
                  onMouseLeave={() => setHoveredTool(null)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 ${
                    isActive 
                      ? "bg-[#df4c16] text-white shadow-lg" 
                      : "bg-[#2a2630] hover:bg-[#35303c] text-[#8c8796] hover:text-white"
                  }`}
                  title={`${tool.name} (${tool.shortcut})`}
                >
                  <Icon size={18} />
                </button>
                
                {/* Hover tooltip */}
                {isHovered && (
                  <div className="absolute left-12 top-0 z-50 bg-[#151316] text-white px-3 py-2 rounded-lg shadow-xl border border-[#2a2630] min-w-max">
                    <div className="font-semibold text-sm">{tool.name}</div>
                    <div className="text-xs text-[#ada8b7]">{tool.description}</div>
                    <div className="text-xs text-[#8c8796] mt-1">Shortcut: {tool.shortcut}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#1f1c21] border-r border-[#2a2630] p-4 flex flex-col ${className}`}>
      <h3 className="text-sm font-semibold mb-4 text-[#8c8796]">Tools</h3>
      
      <div className="space-y-2 mb-6">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = selectedTool.type === tool.id;
          const isHovered = hoveredTool === tool.id;
          
          return (
            <div key={tool.id} className="relative">
              <button
                onClick={() => handleToolSelect(tool.id)}
                onMouseEnter={() => setHoveredTool(tool.id)}
                onMouseLeave={() => setHoveredTool(null)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? "bg-[#df4c16] text-white shadow-lg" 
                    : "bg-[#2a2630] hover:bg-[#35303c] text-[#8c8796] hover:text-white"
                }`}
              >
                <Icon size={20} className="flex-shrink-0" />
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">{tool.name}</div>
                  <div className="text-xs opacity-60">{tool.shortcut}</div>
                </div>
                {isActive && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                )}
              </button>
              
              {/* Hover tooltip */}
              {isHovered && (
                <div className="absolute left-full top-0 ml-2 z-50 bg-[#151316] text-white px-3 py-2 rounded-lg shadow-xl border border-[#2a2630] min-w-max">
                  <div className="font-semibold text-sm">{tool.name}</div>
                  <div className="text-xs text-[#ada8b7]">{tool.description}</div>
                  <div className="text-xs text-[#8c8796] mt-1">Shortcut: {tool.shortcut}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-auto pt-4 border-t border-[#2a2630]">
        <div className="text-xs text-[#8c8796] space-y-1">
          <div>🖱️ Left click: Primary color</div>
          <div>🖱️ Right click: Secondary color</div>
          <div>⌨️ Press tool shortcut to select</div>
        </div>
      </div>
    </div>
  );
}