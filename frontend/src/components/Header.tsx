import { ArrowBack, ArrowForward, Download, Save, SettingsHorizontal } from "akar-icons";
import { Link } from "react-router-dom";
import MenuDropdown from "./MenuDropdown";
import { useEditorStore } from "../lib/store";
import { exportProjectAsImage } from "../utils/exportUtils";

interface HeaderProps {
  onNewFile?: () => void;
}

export default function Header({ onNewFile }: HeaderProps) {
  const { currentProject } = useEditorStore();

  const handleExport = () => {
    exportProjectAsImage(currentProject);
  };

  return (
    <div className="h-12 bg-[#2e2a33] border-b border-[#1f1c21] flex items-center justify-between px-4 select-none z-20 relative">
       {/* Left: Logo & Menus */}
       <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center justify-center w-8 h-8 bg-red-500 rounded text-white font-bold text-xl font-mono shadow-sm hover:scale-105 transition-transform">
            P
          </Link>
          
          <nav className="flex items-center gap-1 text-xs font-bold text-gray-400">
             <MenuDropdown 
                label="FILE" 
                items={[
                  { label: "New File", onClick: () => onNewFile?.(), shortcut: "Ctrl+N" },
                  { label: "Export PNG", onClick: handleExport, shortcut: "Ctrl+E" },
                  { label: "Save Project", onClick: () => console.log("Save triggered") },
                ]} 
             />
             <MenuDropdown 
                label="EDIT" 
                items={[
                  { label: "Undo", onClick: () => console.log("Undo") },
                  { label: "Redo", onClick: () => console.log("Redo") },
                  { label: "Clear Canvas", onClick: () => console.log("Clear"), danger: true },
                ]} 
             />
             <MenuDropdown 
                label="VIEW" 
                items={[
                   { label: "Zoom In", onClick: () => {} },
                   { label: "Zoom Out", onClick: () => {} },
                   { label: "Fit to Screen", onClick: () => {} },
                ]} 
             />
             <MenuDropdown 
                label="LAYER" 
                items={[
                   { label: "New Layer", onClick: () => {} },
                   { label: "Delete Layer", onClick: () => {} },
                ]} 
             />
             
             <button className="px-3 py-1.5 hover:bg-[#3d3842] hover:text-white rounded transition flex items-center gap-1">
                <SettingsHorizontal size={12} /> SETTINGS
             </button>
          </nav>
       </div>

       {/* Right: Actions */}
       <div className="flex items-center gap-2">
          <button 
             onClick={handleExport}
             className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#3d3842] rounded text-gray-300 transition text-xs font-bold uppercase"
          >
             <Download size={14} />
             <span className="hidden sm:inline">Download</span>
          </button>

          <div className="h-4 w-px bg-[#3d3842] mx-1"></div>

          {/* Undo/Redo Group */}
          <div className="flex items-center gap-1 mr-2">
            <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#3d3842] rounded text-gray-300 transition text-xs font-bold uppercase" title="Undo">
                <ArrowBack size={14} /> <span className="hidden sm:inline">Undo</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#3d3842] rounded text-gray-300 transition text-xs font-bold uppercase" title="Redo">
                <ArrowForward size={14} /> <span className="hidden sm:inline">Redo</span>
            </button>
          </div>

          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded shadow-sm flex items-center gap-2 transition ml-2">
             <Save size={14} /> SAVE DRAWING
          </button>
       </div>
    </div>
  );
}