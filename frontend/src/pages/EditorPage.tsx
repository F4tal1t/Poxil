import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useEditorStore } from "../lib/store";
import axios from "axios";

export default function EditorPage() {
  const { projectId } = useParams();
  const { currentProject, setCurrentProject } = useEditorStore();

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    }
  }, [projectId]);

  const fetchProject = async (id: string) => {
    try {
      const res = await axios.get(`/api/projects/${id}`);
      setCurrentProject(res.data);
    } catch (error) {
      console.error("Failed to fetch project", error);
    }
  };

  if (!currentProject) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <header className="bg-gray-800 px-4 py-2 flex justify-between items-center">
        <h1 className="text-xl font-bold">{currentProject.name}</h1>
        <button className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">
          Save
        </button>
      </header>

      <main className="flex-1 flex">
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-gray-800 p-4 rounded">
            <canvas className="canvas-grid border border-gray-600" />
          </div>
        </div>

        <aside className="w-64 bg-gray-800 p-4">
          <h3 className="font-semibold mb-4">Tools</h3>
          {/* Tool buttons will go here */}
        </aside>
      </main>

      <footer className="bg-gray-800 px-4 py-2">
        <div className="flex gap-2">
          {/* Timeline frames will go here */}
        </div>
      </footer>
    </div>
  );
}
