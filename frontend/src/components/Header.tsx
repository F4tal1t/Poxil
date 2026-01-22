import { useState } from "react";
import { ArrowBack, ArrowForward, Download, Save, SettingsHorizontal } from "akar-icons";
import { Link } from "react-router-dom";
import MenuDropdown from "./MenuDropdown";
import { useEditorStore } from "../lib/store";
import { exportProjectAsImage, exportProjectAsGif } from "../utils/exportUtils";
import ExportDialog from "./ExportDialog"; // We will repurpose this or use simple window.confirm

interface HeaderProps {
  onNewFile?: () => void;
}

export default function Header({ onNewFile }: HeaderProps) {
  const { 
    currentProject, 
    undo, 
    redo, 
    clearCanvas,
    past,
    future 
  } = useEditorStore();
  
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  // New File Logic with Save Prompt
  const handleNewFile = () => {
    // Check if dirty? For now, just ask if they want to discard if there is history
    if (past.length > 0) {
      if (window.confirm("You have unsaved changes. Discard them and create a new file?")) {
        onNewFile?.();
      }
    } else {
      onNewFile?.();
    }
  };

  const handleExportClick = () => {
    setShowExportDialog(true);
  };

  const handleExportConfirm = (scale: number, format: 'png' | 'gif') => {
    if (format === 'png') {
        exportProjectAsImage(currentProject, scale);
    } else {
        exportProjectAsGif(currentProject, scale, 12); // Default FPS 12 for now
    }
    setShowExportDialog(false);
  };

  const handleSave = () => {
     // For now, save to JSON file
     if(!currentProject) return;
     const data = JSON.stringify(currentProject);
     const blob = new Blob([data], { type: "application/json" });
     const url = URL.createObjectURL(blob);
     const link = document.createElement("a");
     link.href = url;
     link.download = `${currentProject.name}.poxil`;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  return (
    <>
      {showExportDialog && (
        <ExportDialog 
          project={currentProject} 
          onClose={() => setShowExportDialog(false)} 
          onExport={handleExportConfirm} 
        />
      )}
      
      {/* Simple Settings Dialog Placeholder */}
      {showSettingsDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
           <div className="bg-[#1f1c21] p-6 rounded-xl border border-[#2a2630] shadow-2xl w-80">
              <h2 className="text-xl font-bold text-white mb-4">Settings</h2>
              <div className="space-y-4">
                 <div className="flex items-center justify-between text-gray-400">
                    <span>Theme</span>
                    <select className="bg-[#2a2630] rounded border border-gray-600 outline-none text-xs p-1">
                        <option>Dark</option>
                        <option value="light" disabled>Light (Coming Soon)</option>
                    </select>
                 </div>
                 <div className="flex items-center justify-between text-gray-400">
                    <span>Checking for updates...</span>
                    <span className="text-xs text-gray-500">v1.0.0</span>
                 </div>
              </div>
              <div className="mt-6 flex justify-end">
                 <button onClick={() => setShowSettingsDialog(false)} className="px-4 py-2 bg-[#df4c16] text-white rounded hover:bg-[#c94514]">
                    Close
                 </button>
              </div>
           </div>
        </div>
      )}

      <div className="h-12 bg-[#2e2a33] border-b border-[#1f1c21] flex items-center justify-between px-4 select-none z-20 relative">
       {/* Left: Logo & Menus */}
       <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center justify-center w-8 h-8 rounded text-white font-emphasis text-xl font-mono shadow-sm hover:scale-105 transition-transform" title="Go to Dashboard">
            P
          </Link>
          
          <nav className="flex items-center gap-1 text-xs font-bold text-gray-400">
             <MenuDropdown 
                label="File" 
                items={[
                  { label: "New File", onClick: handleNewFile, shortcut: "Ctrl+N" },
                  { label: "Export PNG", onClick: handleExportClick, shortcut: "Ctrl+E" },
                  { label: "Save Project", onClick: handleSave, shortcut: "Ctrl+S" },
                ]} 
             />
             <MenuDropdown 
                label="Edit" 
                items={[
                  { label: "Undo", onClick: undo, shortcut: "Ctrl+Z", disabled: past.length === 0 },
                  { label: "Redo", onClick: redo, shortcut: "Ctrl+Y", disabled: future.length === 0 },
                  { label: "Clear Canvas", onClick: () => { if(confirm("Clear active layer?")) clearCanvas(); }, danger: true },
                ]} 
             />
             <MenuDropdown 
                label="View" 
                items={[
                   { label: "Zoom In", onClick: () => {} },
                   { label: "Zoom Out", onClick: () => {} },
                   { label: "Fit to Screen", onClick: () => {} },
                ]} 
             />
             
             <button 
                onClick={() => setShowSettingsDialog(true)}
                className="px-3 py-1.5 hover:bg-[#3d3842] hover:text-white rounded transition flex items-center gap-1"
             >
                <SettingsHorizontal size={12} /> Settings
             </button>
          </nav>
       </div>

       <div className="flex items-center gap-2">
          <button 
             onClick={handleSave}
             className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#3d3842] rounded text-gray-300 transition text-xs font-bold uppercase"
             title="Save to local .poxil file"
          >
             <Save size={14} />
             <span className="hidden sm:inline">Save</span>
          </button>

          <button 
             onClick={handleExportClick}
             className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#3d3842] rounded text-gray-300 transition text-xs font-bold uppercase"
          >
             <Download size={14} />
             <span className="hidden sm:inline">Download</span>
          </button>

          <div className="h-4 w-px bg-[#3d3842] mx-1"></div>

          {/* Undo/Redo Group */}
          <div className="flex items-center gap-1 mr-2">
            <button 
                onClick={undo}
                disabled={past.length === 0}
                className={`flex items-center gap-2 px-3 py-1.5 rounded transition text-xs font-bold uppercase ${
                    past.length === 0 ? "text-gray-600 cursor-not-allowed" : "hover:bg-[#3d3842] text-gray-300"
                }`} 
                title="Undo (Ctrl+Z)"
            >
                <ArrowBack size={14} /> <span className="hidden sm:inline">Undo</span>
            </button>
            <button 
                onClick={redo}
                disabled={future.length === 0}
                className={`flex items-center gap-2 px-3 py-1.5 rounded transition text-xs font-bold uppercase ${
                    future.length === 0 ? "text-gray-600 cursor-not-allowed" : "hover:bg-[#3d3842] text-gray-300"
                }`}
                title="Redo (Ctrl+Y)"
            >
                <ArrowForward size={14} /> <span className="hidden sm:inline">Redo</span>
            </button>
          </div>


          <button className="px-4 py-2 bg-[#df4c16] hover:bg-[#E95620] text-white text-xs font-bold rounded shadow-sm flex items-center gap-2 transition ml-2">
             <Save size={14} /> Save Drawing
          </button>
       </div>
    </div>
    </>
  );
}