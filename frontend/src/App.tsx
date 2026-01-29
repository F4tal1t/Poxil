import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSession } from "./lib/auth";
import axios from "axios";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import EditorPage from "./pages/EditorPage";
import LoadingScreen from "./components/LoadingScreen";

// Configure Axios Global Defaults
// Normalize API URL: Remove trailing slash and /api suffix to prevent double segments
const apiUrl = import.meta.env.VITE_API_URL || "";
axios.defaults.baseURL = apiUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
axios.defaults.withCredentials = true;

// Helper to detect mobile
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);
    return isMobile;
};

// Mobile blocking overlay
function MobileOverlay() {
    return (
        <div className="fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col items-center justify-center p-8 text-center text-white">
            <div className="mb-6">
                <h1 className="text-4xl font-emphasis text-[#df4c16]" style={{ fontFamily: 'Retrogression, sans-serif' }}>Poxil</h1>
            </div>
            <h2 className="text-2xl font-bold mb-4 font-primary">Desktop Required</h2>
            <p className="text-gray-400 max-w-md font-primary">
                Poxil is a professional grade pixel-art editor designed for mouse and keyboard workflows.
            </p>
            <p className="mt-4 text-sm text-gray-500 font-primary">
                Please access this URL from a desktop or laptop computer.
            </p>
        </div>
    );
}

function App() {
  const { data: session, isPending } = useSession();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!import.meta.env.VITE_API_URL) {
      console.warn("CRITICAL: VITE_API_URL is missing. API calls will fail (405). Set this in Vercel settings.");
    }
  }, []);

  useEffect(() => {
    // Wait for fonts or timeout after 2 seconds to prevent infinite loading
    Promise.race([
      document.fonts.ready,
      new Promise((resolve) => setTimeout(resolve, 2000))
    ]).then(() => {
       setFontsLoaded(true);
    });
  }, []);

  // Safety timeout for Session Loading (fixes infinite load on backend misconfig)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showLoader) { 
        console.warn("Session loading timed out - Forcing app load. Check VITE_BETTER_AUTH_URL.");
        setShowLoader(false); 
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [showLoader]);

  useEffect(() => {
     if (!isPending && fontsLoaded) {
         // Small delay to ensure the new route is painted before lifting the curtain
         const timer = setTimeout(() => {
             setShowLoader(false);
         }, 800); 
         return () => clearTimeout(timer);
     }
  }, [isPending, fontsLoaded]);

  if (isMobile) {
      return <MobileOverlay />;
  }

  return (
    <>
      <LoadingScreen isLoading={showLoader} />
      
      {(!isPending || !showLoader) && (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/login"
              element={session ? <Navigate to="/dashboard" /> : <LoginPage />}
            />
            <Route
              path="/dashboard"
              element={session ? <DashboardPage /> : <Navigate to="/login" />}
            />
            <Route
              path="/editor/:projectId"
              element={<EditorPage />}
            />
          </Routes>
        </BrowserRouter>
      )}
    </>
  );
}

export default App;
