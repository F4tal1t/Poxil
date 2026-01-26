import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSession } from "./lib/auth";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import EditorPage from "./pages/EditorPage";
import LoadingScreen from "./components/LoadingScreen";

function App() {
  const { data: session, isPending } = useSession();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    document.fonts.ready.then(() => {
       setFontsLoaded(true);
    });
  }, []);

  useEffect(() => {
     if (!isPending && fontsLoaded) {
         // Small delay to ensure the new route is painted before lifting the curtain
         const timer = setTimeout(() => {
             setShowLoader(false);
         }, 800); 
         return () => clearTimeout(timer);
     }
  }, [isPending, fontsLoaded]);

  return (
    <>
      <LoadingScreen isLoading={showLoader} />
      
      {!isPending && (
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
              element={session ? <EditorPage /> : <Navigate to="/login" />}
            />
          </Routes>
        </BrowserRouter>
      )}
    </>
  );
}

export default App;
