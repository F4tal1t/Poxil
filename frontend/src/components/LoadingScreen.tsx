import { useEffect, useState } from "react";

interface LoadingScreenProps {
  isLoading: boolean;
}

export default function LoadingScreen({ isLoading }: LoadingScreenProps) {
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      // Wait for the animation to finish before unmounting (if we were strictly unmounting)
      // typically we leave it in DOM but moved off-screen, or remove after timeout.
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 1000); // Match transition duration
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#151316] transition-transform duration-1500 ease-in-out ${
        !isLoading ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="relative">
         {/* Using the Loader GIF as defined in favicon/requirements */}
         <img src="/Loader.gif" alt="Loading..." className="w-48 h-48 object-contain" />
         
      </div>
    </div>
  );
}
