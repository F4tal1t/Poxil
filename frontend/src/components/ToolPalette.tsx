import { useState, useEffect } from "react";
import { Pencil, Plus, Minus } from "akar-icons";
import { useEditorStore } from "../lib/store";

// Custom SVG icons for tools
const EraserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
    <g clipPath="url(#clip0_eraser)">
      <path d="M11.6066 6.53552L3.82843 14.3137C3.04738 15.0947 3.04738 16.3611 3.82843 17.1421L5.36396 18.6777C5.73904 19.0527 6.24774 19.2634 6.77818 19.2634H13.0208M11.6066 6.53552L13.7279 4.4142C14.509 3.63315 15.7753 3.63315 16.5564 4.4142L20.799 8.65684C21.58 9.43789 21.58 10.7042 20.799 11.4853L18.6777 13.6066M11.6066 6.53552L18.6777 13.6066M18.6777 13.6066L13.0208 19.2634M13.0208 19.2634H20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
    </g>
    <defs>
      <clipPath id="clip0_eraser">
        <rect fill="white" height="24" width="24"/>
      </clipPath>
    </defs>
  </svg>
);

const ColorPickerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
     <path d="M19.4 7.34L16.66 4.6A1.92 1.92 0 0 0 14 4.53l-2 2-1.29-1.24a1 1 0 0 0-1.42 1.42L10.53 8 5 13.53a2 2 0 0 0-.57 1.21L4 18.91a1 1 0 0 0 .29.8A1 1 0 0 0 5 20h.09l4.17-.38a2 2 0 0 0 1.21-.57l5.58-5.58 1.24 1.24a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42l-1.24-1.24 2-2a1.92 1.92 0 0 0-.07-2.71zm-13 7.6L12 9.36l2.69 2.7-2.79 2.79"/>
  </svg>
);

const FillBucketIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
    <path d="M19.228 18.732l1.768-1.768 1.767 1.768a2.5 2.5 0 1 1-3.535 0zM8.878 1.08l11.314 11.313a1 1 0 0 1 0 1.415l-8.485 8.485a1 1 0 0 1-1.414 0l-8.485-8.485a1 1 0 0 1 0-1.415l7.778-7.778-2.122-2.121L8.88 1.08zM11 6.03L3.929 13.1H18.07L11 6.03z"/>
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