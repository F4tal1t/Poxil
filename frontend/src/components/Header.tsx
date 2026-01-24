import { useState } from "react";
import { ArrowBack, ArrowForward, Download, Save, SettingsHorizontal, ArrowLeft, ShareBox } from "akar-icons";
import { Link, useNavigate } from "react-router-dom";
import MenuDropdown from "./MenuDropdown";
import { useEditorStore } from "../lib/store";
import { exportProjectAsImage, exportProjectAsGif, exportProjectAsSvg } from "../utils/exportUtils";
import ExportDialog from "./ExportDialog";
import ShareDialog from "./ShareDialog";
import ConfirmDialog from "./ConfirmDialog";
import Toast, { ToastType } from "./Toast";
import axios from "axios";

interface HeaderProps {
  onNewFile?: () => void;
}

export default function Header({ onNewFile }: HeaderProps) {
  const navigate = useNavigate();
  const { 
    currentProject,
    setCurrentProject,
    undo, 
    redo, 
    clearCanvas,
    past,
    future 
  } = useEditorStore();
  
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [projectName, setProjectName] = useState(currentProject?.name || "Untitled");
  const [isSaving, setIsSaving] = useState(false);
  
  // UI State
  const [toast, setToast] = useState<{message: string, type: ToastType} | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, config: any}>({
     isOpen: false,
     config: {}
  });

  const handleTogglePublic = async (isPublic: boolean) => {
    if (!currentProject) return;
    try {
      await axios.put(`/api/projects/${currentProject.id}`, { isPublic });
      setCurrentProject({ ...currentProject, isPublic });
      showToast(`Project is now ${isPublic ? 'Public' : 'Private'}`, 'success');
    } catch (error) {
      showToast("Failed to update privacy settings", 'error');
    }
  };

  // New File Logic with Save Prompt
  const handleNewFile = () => {
    // Check if dirty? For now, just ask if they want to discard if there is history
    if (past.length > 0) {
      setConfirmDialog({
        isOpen: true,
        config: {
           title: "Create New File?",
           message: "You have unsaved changes. Are you sure you want to discard them and start a new file?",
           onConfirm: () => {
              onNewFile?.();
              setConfirmDialog({ isOpen: false, config: {} });
           },
           isDangerous: true,
           confirmText: "Discard & Create"
        }
      });
    } else {
      onNewFile?.();
    }
  };

  const handleClearCanvas = () => {
      setConfirmDialog({
        isOpen: true,
        config: {
           title: "Clear Canvas?",
           message: "Are you sure you want to clear the entire canvas? This cannot be fully undone if history limit is reached.",
           onConfirm: () => {
              clearCanvas();
              setConfirmDialog({ isOpen: false, config: {} });
           },
           isDangerous: true,
           confirmText: "Clear Canvas"
        }
      });
  };

  const handleExportClick = () => {
    setShowExportDialog(true);
  };

  const handleExportConfirm = (scale: number, format: 'png' | 'gif' | 'svg') => {
    if (format === 'png') {
        exportProjectAsImage(currentProject, scale);
    } else if (format === 'svg') {
        exportProjectAsSvg(currentProject, scale);
    } else {
        exportProjectAsGif(currentProject, scale, 12); // Default FPS 12 for now
    }
    setShowExportDialog(false);
  };

  const handleSaveClick = () => {
    if (!currentProject) return;
    setProjectName(currentProject.name);
    setShowSaveDialog(true);
  };

  const showToast = (message: string, type: ToastType = 'info') => {
      setToast({ message, type });
  };

  const handleSaveConfirm = async () => {
    if (!currentProject) return;
    
    setIsSaving(true);
    try {
      const updatedProject = {
        ...currentProject,
        name: projectName
      };
      
      // If project has an ID (it should), update it
      if (currentProject.id && currentProject.id !== "temp-project") {
        await axios.put(`/api/projects/${currentProject.id}`, {
          name: projectName,
          description: currentProject.description || undefined,
          width: currentProject.width,   // Save current width
          height: currentProject.height, // Save current height
          frames: currentProject.frames,
          layers: currentProject.layers,
          isPublic: currentProject.isPublic
        });
      } else {
        // If it's a temp project, create it
        const res = await axios.post("/api/projects", {
            name: projectName,
            width: currentProject.width,
            height: currentProject.height,
            frames: currentProject.frames,
            layers: currentProject.layers
        });
        updatedProject.id = res.data.id;
      }

      setCurrentProject(updatedProject);
      setShowSaveDialog(false);
      showToast("Project saved successfully!", "success");
    } catch (error: any) {
      console.error("Failed to save project:", error);
      if (error.response?.data?.details) {
        showToast(`Validation error: ${error.response.data.details[0]?.message || 'Unknown'}`, "error");
      } else {
        showToast("Failed to save project. Please try again.", "error");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
      )}

      <ShareDialog 
         isOpen={showShareDialog} 
         isPublic={currentProject?.isPublic || false}
         projectId={currentProject?.id || ''}
         onClose={() => setShowShareDialog(false)}
         onTogglePublic={handleTogglePublic}
      />

      <ConfirmDialog 
         isOpen={confirmDialog.isOpen}
         onCancel={() => setConfirmDialog({ isOpen: false, config: {} })}
         {...confirmDialog.config}
      />

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

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
           <div className="bg-[#1f1c21] p-6 rounded-xl border border-[#2a2630] shadow-2xl w-96">
              <h2 className="text-xl font-bold text-white mb-4">Save Project</h2>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-gray-400 text-sm">Project Name</label>
                    <input 
                        type="text" 
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full bg-[#2a2630] border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-[#df4c16]"
                    />
                 </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                 <button 
                    onClick={() => setShowSaveDialog(false)} 
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                 >
                    Cancel
                 </button>
                 <button 
                    onClick={handleSaveConfirm} 
                    disabled={isSaving}
                    className="px-4 py-2 bg-[#df4c16] text-white rounded hover:bg-[#c94514] disabled:opacity-50"
                 >
                    {isSaving ? "Saving..." : "Save"}
                 </button>
              </div>
           </div>
        </div>
      )}

      <div className="h-12 bg-[#2e2a33] border-b border-[#1f1c21] flex items-center justify-between px-4 select-none z-20 relative">
       {/* Left: Logo & Menus */}
       <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center w-8 h-8 rounded text-white bg-[#3d3842] hover:bg-[#4d4852] transition-colors" 
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          
          <nav className="flex items-center gap-1 text-xs font-bold text-gray-400">
             <MenuDropdown 
                label="File" 
                items={[
                  { label: "New File", onClick: handleNewFile, shortcut: "Ctrl+N" },
                  { label: "Export PNG", onClick: handleExportClick, shortcut: "Ctrl+E" },
                  { label: "Save Project", onClick: handleSaveClick, shortcut: "Ctrl+S" },
                ]} 
             />
             <MenuDropdown 
                label="Edit" 
                items={[
                  { label: "Undo", onClick: undo, shortcut: "Ctrl+Z", disabled: past.length === 0 },
                  { label: "Redo", onClick: redo, shortcut: "Ctrl+Y", disabled: future.length === 0 },
                  { label: "Clear Canvas", onClick: handleClearCanvas, danger: true },
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
             onClick={() => setShowShareDialog(true)}
             className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#3d3842] rounded text-gray-300 transition text-xs font-bold uppercase"
          >
             <ShareBox size={14} />
             <span className="hidden sm:inline">Share</span>
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


          <button 
             onClick={handleSaveClick}
             className="px-4 py-2 bg-[#df4c16] hover:bg-[#E95620] text-white text-xs font-bold rounded shadow-sm flex items-center gap-2 transition ml-2"
          >
             <Save size={14} /> Save Project
          </button>
       </div>
    </div>
    </>
  );
}