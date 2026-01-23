import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, useSession } from "../lib/auth";
import { Project } from "../types";
import axios from "axios";
import { Plus, SignOut, Image, Search, TrashBin } from "akar-icons";
import ConfirmDialog from "../components/ConfirmDialog";

export default function DashboardPage() {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog State
  const [deleteData, setDeleteData] = useState<{ isOpen: boolean, projectId: string | null }>({
    isOpen: false,
    projectId: null
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get("/api/projects");
      setProjects(res.data);
    } catch (error) {
      console.error("Failed to fetch projects", error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    try {
      const res = await axios.post("/api/projects", {
        name: "New Project",
        width: 32,
        height: 32,
      });
      navigate(`/editor/${res.data.id}`);
    } catch (error) {
      console.error("Failed to create project", error);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setDeleteData({ isOpen: true, projectId });
  };

  const activeDeleteProject = projects.find(p => p.id === deleteData.projectId);

  const confirmDelete = async () => {
    if (!deleteData.projectId) return;

    try {
      await axios.delete(`/api/projects/${deleteData.projectId}`);
      setProjects(projects.filter(p => p.id !== deleteData.projectId));
    } catch (error) {
      console.error("Failed to delete project", error);
      alert("Failed to delete project");
    } finally {
      setDeleteData({ isOpen: false, projectId: null });
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#151316] text-[#cecece] font-primary">
      <ConfirmDialog 
        isOpen={deleteData.isOpen}
        title="Delete Project?"
        message={`Are you sure you want to delete "${activeDeleteProject?.name || 'this project'}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteData({ isOpen: false, projectId: null })}
        confirmText="Delete"
        isDangerous={true}
      />
      
      {/* Header */}
      <header className="bg-[#1f1c21] border-b border-[#2a2630]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <h1 className="text-xl font-emphasis text-white tracking-tight">Poxil</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
               {session?.user?.image && <img src={session.user.image} alt="Profile" className="w-8 h-8 rounded-full border border-[#2a2630]" />}
               <span className="font-primary text-sm">{session?.user?.name}</span>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-primary bg-[#2a2630] hover:bg-[#35303c] rounded border border-[#3e3846] transition-colors"
            >
              <SignOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-primary text-white mb-1">My Projects</h2>
            <p className="text-sm text-gray-400">Manage and edit your pixel art creations</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
               <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
               <input 
                 type="text" 
                 placeholder="Search projects..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full bg-[#1f1c21] border border-[#2a2630] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#df4c16] transition-colors"
               />
            </div>
            <button
              onClick={createProject}
              className="flex items-center gap-2 px-4 py-2 bg-[#df4c16] hover:bg-[#c94514] text-white rounded-lg font-primary text-sm transition-colors shadow-lg shadow-[#df4c16]/20 whitespace-nowrap"
            >
              <Plus size={16} />
              New Project
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#df4c16]"></div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20 bg-[#1f1c21] rounded-xl border border-[#2a2630] border-dashed">
             <Image size={48} className="mx-auto text-[#2a2630] mb-4" />
             <h3 className="text-lg font-primary text-white mb-2">No projects found</h3>
             <p className="text-gray-500 text-sm mb-6">Get started by creating your first masterpiece!</p>
             <button
              onClick={createProject}
              className="px-4 py-2 bg-[#2a2630] hover:bg-[#35303c] text-white rounded font-primary text-sm transition-colors border border-[#3e3846]"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/editor/${project.id}`)}
                className="group relative bg-[#1f1c21] border border-[#2a2630] rounded-xl overflow-hidden hover:border-[#df4c16]/50 hover:shadow-xl hover:shadow-[#df4c16]/10 transition-all cursor-pointer aspect-square flex flex-col"
              >
                {/* Delete Button */}
                <button 
                    onClick={(e) => handleDeleteClick(e, project.id)}
                    className="absolute top-2 right-2 p-2 bg-[#1f1c21]/80 hover:bg-red-500/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm z-10"
                    title="Delete Project"
                >
                    <TrashBin size={16} />
                </button>

                {/* Preview Placeholder - In real app, render a thumbnail */}
                <div className="flex-1 bg-[#252228] pattern-checkers flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 pattern-grid pointer-events-none"></div>
                    <div className="w-16 h-16 bg-[#df4c16] shadow-lg shadow-[#df4c16]/20 rounded opacity-20 group-hover:opacity-40 transition-opacity transform group-hover:scale-110 duration-300"></div>
                </div>
                
                <div className="p-4 bg-[#1f1c21] border-t border-[#2a2630] group-hover:bg-[#252128] transition-colors">
                  <h3 className="font-primary text-white truncate group-hover:text-[#df4c16] transition-colors">{project.name}</h3>
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                     <span>{project.width}x{project.height}px</span>
                     <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
