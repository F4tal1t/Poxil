import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, useSession } from "../lib/auth";
import { Project } from "../types";
import axios from "axios";

export default function DashboardPage() {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Poxil</h1>
          <div className="flex items-center gap-4">
            <span>{session?.user?.name}</span>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">My Projects</h2>
          <button
            onClick={createProject}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            New Project
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : projects.length === 0 ? (
          <p className="text-gray-500">No projects yet. Create one to get started!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/editor/${project.id}`)}
                className="p-4 bg-white rounded shadow cursor-pointer hover:shadow-lg"
              >
                <h3 className="font-semibold">{project.name}</h3>
                <p className="text-sm text-gray-500">
                  {project.width}x{project.height} • {project.frames?.length || 0} frames
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
